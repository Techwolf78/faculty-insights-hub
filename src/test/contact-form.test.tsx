import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { ContactForm } from "@/components/ContactForm";
import * as toastModule from "@/hooks/use-toast";

// mock firestore helpers
const addDocMock = vi.fn();
const collectionMock = vi.fn();
const serverTimestampMock = vi.fn(() => ({ ts: Date.now() }));
vi.mock("firebase/firestore", () => ({
  addDoc: addDocMock,
  collection: collectionMock,
  serverTimestamp: serverTimestampMock,
}));

// silence the toast implementation by spying
let toastSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  toastSpy = vi.spyOn(toastModule, "toast");
});
afterEach(() => {
  vi.resetAllMocks();
});

describe("ContactForm component", () => {
  it("renders fields and respects default category", () => {
    render(
      <ContactForm
        isOpen={true}
        onClose={() => {}}
        defaultCategory="demo"
      />
    );

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/institution name/i)).toBeInTheDocument();

    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("demo");
  });

  it("shows validation errors when submitted empty", async () => {
    render(<ContactForm isOpen={true} onClose={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: /submit request/i }));

    expect(await screen.findByText(/name must be at least 2 characters/i)).toBeVisible();
    expect(screen.getByText(/invalid email address/i)).toBeVisible();
    expect(screen.getByText(/institution name is required/i)).toBeVisible();
    expect(screen.getByText(/message must be at least 10 characters/i)).toBeVisible();
  });

  it("submits valid data and resets form", async () => {
    collectionMock.mockReturnValue("dummyCollection");
    addDocMock.mockResolvedValue({ id: "xyz" });

    const handleClose = vi.fn();

    render(<ContactForm isOpen={true} onClose={handleClose} defaultCategory="pricing" />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Alice" } });
    fireEvent.change(screen.getByLabelText(/work email/i), { target: { value: "alice@example.com" } });
    fireEvent.change(screen.getByLabelText(/institution name/i), { target: { value: "Test U" } });
    // message
    fireEvent.change(screen.getByRole("textbox", { name: /additional context/i }), {
      target: { value: "Hello world!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /submit request/i }));

    await waitFor(() => {
      expect(addDocMock).toHaveBeenCalled();
    });

    // ensure toast was shown
    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Inquiry Received" })
    );

    // after submit button disabled state should have been toggled back
    expect(screen.getByRole("button", { name: /submit request/i })).not.toBeDisabled();
    expect(handleClose).toHaveBeenCalled();
  });
});
