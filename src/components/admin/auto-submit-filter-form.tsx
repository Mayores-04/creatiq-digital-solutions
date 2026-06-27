"use client";

import type { FormHTMLAttributes, ReactNode } from "react";
import { useRef } from "react";

type AutoSubmitFilterFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "onChange" | "children"> & {
  children: ReactNode;
};

export function AutoSubmitFilterForm({ children, ...props }: AutoSubmitFilterFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      {...props}
      onChange={() => {
        formRef.current?.requestSubmit();
      }}
    >
      {children}
    </form>
  );
}
