import { useState } from "react";

export default function CopyToClipboard(props: { text: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const copyTextToClipboard = async () => {
    if ("clipboard" in navigator) {
      try {
        await navigator.clipboard.writeText(props.text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset copied state after 2 seconds
      } catch (err) {
        console.error("Failed to copy: ", err);
      }
    } else {
      console.error("Clipboard API not supported");
    }
  };

  return (
    <button onClick={copyTextToClipboard}>
      {isCopied ? "Copied!" : "Copy to Clipboard"}
    </button>
  );
}
