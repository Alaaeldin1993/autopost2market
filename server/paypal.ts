import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import * as db from "./db";

// PayPal configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox"; // sandbox or live
const PAYPAL_BUSINESS_EMAIL = "alaadeen.it@gmail.com";

export const paypalRouter = router({
  // Get PayPal configuration for frontend
  getConfig: publicProcedure.query(() => {
    return {
      clientId: PAYPAL_CLIENT_ID,
      businessEmail: PAYPAL_BUSINESS_EMAIL,
      mode: PAYPAL_MODE,
    };
  }),

  // Create subscription payment
  createSubscription: protectedProcedure
    .input(z.object({
      packageId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const pkg = await db.getPackageById(input.packageId);
      if (!pkg) {
        throw new Error("Package not found");
      }

      // Create payment record
      const paymentId = await db.createPayment({
        userId: ctx.user.id,
        packageId: input.packageId,
        amount: pkg.price,
        currency: "USD",
        paymentMethod: "paypal",
        status: "pending",
      });

      await db.createActivityLog({
        userId: ctx.user.id,
        action: "payment_initiated",
        description: `User initiated payment for ${pkg.name}`,
        ipAddress: null,
      });

      return {
        paymentId,
        amount: pkg.price,
        packageName: pkg.name,
      };
    }),

  // Handle PayPal webhook/callback
  handlePayment: publicProcedure
    .input(z.object({
      transactionId: z.string(),
      paymentId: z.number(),
      status: z.enum(["completed", "failed"]),
      amount: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Update payment status
      await db.updatePayment(input.paymentId, {
        transactionId: input.transactionId,
        status: input.status,
      });

      if (input.status === "completed") {
        // Get payment details
        const payment = await db.getPaymentById(input.paymentId);
        if (!payment) {
          throw new Error("Payment not found");
        }

        // Get package details
        const pkg = payment.packageId ? await db.getPackageById(payment.packageId) : null;
        
        // Update user subscription
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (pkg?.durationDays || 30));

        await db.updateUser(payment.userId, {
          subscriptionStatus: "active",
          subscriptionPackageId: payment.packageId,
          subscriptionExpiresAt: expiresAt,
        });

        await db.createActivityLog({
          userId: payment.userId,
          action: "subscription_activated",
          description: `Subscription activated via PayPal payment ${input.transactionId}`,
          ipAddress: null,
        });
      }

      return { success: true };
    }),

  // Get user's payment history
  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    return await db.getUserPayments(ctx.user.id);
  }),
});
