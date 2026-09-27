import type { ReactNode } from "react";

/** Full-screen tasks (add expense): no navigation pill, nothing to distract. */
export default function TaskLayout({ children }: { children: ReactNode }) {
  return <main>{children}</main>;
}
