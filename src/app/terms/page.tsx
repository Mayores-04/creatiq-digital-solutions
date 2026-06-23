import { ContentPage } from "@/components/site/content-page";

export default function TermsPage() {
  return <ContentPage eyebrow="Terms of service" title="Clear expectations from the start." intro="These terms cover use of the Creatiq website and the initial inquiry process. A separate written agreement will govern any project work." sections={[
    { title: "Website use", paragraphs: ["You may use this website to explore our services and submit legitimate project inquiries. Please do not misuse the site, interfere with its operation, or submit misleading information."] },
    { title: "Project engagement", paragraphs: ["Submitting an inquiry does not create a client relationship, guarantee availability, or form a contract. Scope, timelines, fees, ownership, and delivery terms are confirmed separately before work begins."] },
    { title: "Questions", paragraphs: ["If you have questions about these terms or a proposed engagement, contact creatiq.digitalsolutions@gmail.com before moving forward."] },
  ]} />;
}
