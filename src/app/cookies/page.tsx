import { ContentPage } from "@/components/site/content-page";

export default function CookiesPage() {
  return <ContentPage eyebrow="Cookie settings" title="Simple, transparent site preferences." intro="Creatiq does not intentionally use advertising or behavioural-tracking cookies on this website." sections={[
    { title: "Essential technology", paragraphs: ["The site may use strictly necessary technical storage or cookies to deliver core functionality, security, and reliable navigation. These are not used for advertising profiles."] },
    { title: "Optional cookies", paragraphs: ["If optional analytics, preference, or marketing cookies are added in the future, this page will be updated and an appropriate consent choice will be provided before they are used."] },
    { title: "Control your browser", paragraphs: ["You can manage or remove cookies through your browser settings at any time. Disabling essential storage may affect parts of the website."] },
  ]} />;
}
