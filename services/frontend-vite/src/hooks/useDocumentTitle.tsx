import { useEffect } from "react";

export function useDocumentTitle(title: string, appName = "Wizard") {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} - ${appName}`;

    return () => {
      document.title = previousTitle;
    };
  }, [title, appName]);
}
