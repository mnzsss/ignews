import { useRouter } from "next/router";
import Link, { LinkProps } from "next/link";
import React, { ReactNode } from "react";

interface ActiveLinkProps extends LinkProps {
  children: ReactNode;
  activeClassName: string;
}

export const ActiveLink = ({
  children,
  activeClassName,
  ...props
}: ActiveLinkProps) => {
  const { asPath } = useRouter();

  const className =
    asPath === props.href || asPath === props.as
      ? `${activeClassName}`.trim()
      : null;

  return (
    <Link {...props}>
      <a className={className || null}>{children}</a>
    </Link>
  );
};
