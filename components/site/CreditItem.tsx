import type { CreditData } from "./types";

/** "File name" by Author, Licence. Resized for web. Each photo on the page is credited with its licence. */
export function CreditItem({ credit }: { credit: CreditData }) {
  return (
    <li>
      “<a href={credit.fileUrl} target="_blank" rel="noopener noreferrer">{credit.file}</a>” by {credit.author},{" "}
      <a href={credit.licenceUrl} target="_blank" rel="noopener noreferrer">{credit.licence}</a>
      {credit.note}
    </li>
  );
}
