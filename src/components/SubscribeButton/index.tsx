import { Session } from "next-auth";
import { signIn, useSession } from "next-auth/client";
import { useRouter } from "next/router";

import { api } from "@services/api";
import { getStripeJs } from "@services/stripe-js";

import styles from "./styles.module.scss";

interface UserSession extends Session {
  activeSubscription: any;
}

interface SubscribeButtonProps {
  priceId: string;
}

export function SubscribeButton({ priceId }: SubscribeButtonProps) {
  const [session] = useSession();
  const router = useRouter();

  const handleSubscribe = async () => {
    const userSession = session as UserSession;

    if (!userSession) {
      signIn("github");
      return;
    }

    if (userSession.activeSubscription) {
      router.push("/posts");
      return;
    }

    try {
      const res = await api.post("/subscribe");

      const { sessionId } = res.data;

      const stripe = await getStripeJs();

      await stripe.redirectToCheckout({ sessionId });
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <button
      type="button"
      className={styles.subscribeButton}
      onClick={handleSubscribe}
    >
      Subscribe Now
    </button>
  );
}
