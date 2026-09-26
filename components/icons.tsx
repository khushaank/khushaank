import type { SVGProps } from "react";

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: "home" | "book" | "person" | "lock" | "plus" | "image" | "code" | "arrow" | "copy" | "trash" | "edit" | "close" }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" /></>,
    book: <><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5v-18Z" /><path d="M4 20a2.5 2.5 0 0 1 2.5-2.5H20" /></>,
    person: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 21c.7-3.7 3.2-5.5 7.5-5.5s6.8 1.8 7.5 5.5" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m3 17 5-5 4 4 3-3 6 6" /></>,
    code: <><path d="m8 6-6 6 6 6M16 6l6 6-6 6M14 3l-4 18" /></>,
    arrow: <path d="M5 12h13m-5-5 5 5-5 5" />,
    copy: <><rect x="9" y="9" width="11" height="11" rx="1.5" /><path d="M15 9V5.5A1.5 1.5 0 0 0 13.5 4h-8A1.5 1.5 0 0 0 4 5.5v8A1.5 1.5 0 0 0 5.5 15H9" /></>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M9 7l1-3h4l1 3M6 7l1 14h10l1-14" /></>,
    edit: <><path d="m4 20 4-1 11-11a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" /><path d="m14 7 3 3" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
