import { query as q } from "faunadb";

import { fauna } from "@services/fauna";
import { stripe } from "@services/stripe";

export async function createSubscription(
  subscriptionId: string,
  customerId: string
) {
  const userRef = await fauna.query(
    q.Select(
      "ref",
      q.Get(q.Match(q.Index("user_by_stripe_customer_id"), customerId))
    )
  );

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const subscriptionData = {
    id: subscription.id,
    userId: userRef,
    status: subscription.status,
    priceId: subscription.items.data[0].price.id,
  };

  await fauna.query(
    q.Create(q.Collection("subscriptions"), { data: subscriptionData })
  );
}

export async function updateSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await fauna.query(
    q.Update(
      q.Select(
        "ref",
        q.Get(q.Match(q.Index("subscription_by_id"), subscriptionId))
      ),
      { data: { status: subscription.status } }
    )
  );
}
