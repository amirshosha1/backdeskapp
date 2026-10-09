import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { FEEDBACK_SUBJECT, SUPPORT_EMAIL, supportMailto } from "@/lib/contact";
import { MAIL_FALLBACK_MS, MailLink } from "./mail-link";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const LABEL = "رأيك؟";
const render = () => renderWithIntl(<MailLink href={supportMailto(FEEDBACK_SUBJECT, "x")}>{LABEL}</MailLink>);

describe("supportMailto", () => {
  it("encodes subject and body, and adds nothing else", () => {
    expect(supportMailto(FEEDBACK_SUBJECT, "شاشة /demo & more")).toBe(
      `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("ملاحظة على باك ديسك")}&body=${encodeURIComponent("شاشة /demo & more")}`,
    );
    expect(supportMailto()).toBe(`mailto:${SUPPORT_EMAIL}`);
  });
});

describe("<MailLink />", () => {
  it("shows the address with a copy button when no mail app takes over, and confirms the copy", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render();
    fireEvent.click(screen.getByRole("link", { name: LABEL }));
    expect(screen.queryByTestId("mail-fallback")).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MAIL_FALLBACK_MS + 50);
    });
    expect(screen.getByRole("textbox")).toHaveValue(SUPPORT_EMAIL);
    await act(async () => {
      fireEvent.click(screen.getByTestId("mail-copy"));
    });
    expect(writeText).toHaveBeenCalledWith(SUPPORT_EMAIL);
    expect(screen.getByTestId("mail-copy-status")).toHaveTextContent("تم النسخ");
  });

  it("shows nothing extra when a mail app opens (the page loses focus)", async () => {
    render();
    fireEvent.click(screen.getByRole("link", { name: LABEL }));
    act(() => {
      window.dispatchEvent(new Event("blur"));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MAIL_FALLBACK_MS + 50);
    });
    expect(screen.queryByTestId("mail-fallback")).toBeNull();
  });
});
