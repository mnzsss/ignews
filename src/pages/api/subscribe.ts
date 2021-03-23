import { NextApiRequest, NextApiResponse } from "next";
import { query as q } from "faunadb";

import { stripe } from "@services/stripe";
import { getSession } from "next-auth/client";
import { fauna } from "@services/fauna";

type User = {
  ref: {
    id: string;
  };
  data: {
    stripe_customer_id: string;
  };
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const session = await getSession({ req });

    const user = await fauna.query<User>(
      q.Get(q.Match(q.Index("users_by_email"), q.Casefold(session.user.email)))
    );

    let customerId = user.data.stripe_customer_id;

    if (!customerId) {
      const stripeCustomer = await stripe.customers.create({
        email: session.user.email,
      });

      await fauna.query(
        q.Update(q.Ref(q.Collection("users"), user.ref.id), {
          data: {
            stripe_customer_id: stripeCustomer.id,
          },
        })
      );

      customerId = stripeCustomer.id;
    }

    const stripeCheckoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      billing_address_collection: "required",
      mode: "subscription",
      line_items: [
        {
          price: "price_1IYBRUHtpbj6xhYcF7RnfH6a",
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      cancel_url: process.env.STRIPE_CANCEL_PAGE_URL,
      success_url: process.env.STRIPE_SUCCESS_PAGE_URL,
    });

    return res.status(200).json({ sessionId: stripeCheckoutSession.id });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method not allowed.");
  }
};
