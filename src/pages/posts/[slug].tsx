import { GetServerSideProps } from "next";
import { getSession } from "next-auth/client";
import { RichText } from "prismic-dom";
import Head from "next/head";
import { Session } from "next-auth";

import { getPrismicClient } from "@services/prismic";

import styles from "@styles/post.module.scss";

interface UserSession extends Session {
  activeSubscription: any;
}

interface PostProps {
  post: {
    slug: string;
    title: string;
    content: string;
    updatedAt: string;
  };
}

export default function Post({ post }: PostProps) {
  return (
    <>
      <Head>
        <title>{post.title} | ig.news</title>
      </Head>

      <main className={styles.postContainer}>
        <article className={styles.postWrapper}>
          <h1>{post.title}</h1>
          <time>{post.updatedAt}</time>
          <div
            className={styles.postContent}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  params,
}) => {
  const session = await getSession({ req });
  const userSession = session as UserSession;

  if (!userSession.activeSubscription) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const { slug } = params;

  const prismic = getPrismicClient(req);

  const post = await prismic.getByUID("publication", String(slug), {});

  const serializedPost = {
    slug,
    title: RichText.asText(post.data.title),
    content: RichText.asHtml(post.data.content),
    updatedAt: new Date(post.last_publication_date).toLocaleDateString(
      "pt-BR",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    ),
  };

  return {
    props: {
      post: serializedPost,
    },
  };
};
