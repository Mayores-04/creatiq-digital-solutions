import { ContentPage } from "@/components/site/content-page";

export default function PrivacyPage() {
  return <ContentPage eyebrow="Privacy policy" title="Your information, handled with care." intro="This policy explains the information Creatiq collects through this website and how it is used when you contact us about a project." sections={[
    { title: "Information we collect", paragraphs: ["When you submit an inquiry, we collect the name, email address, selected services, and project description you provide. We may also receive technical information required to deliver and secure the website."] },
    { title: "How we use it", paragraphs: ["We use inquiry details to review your request, reply to you, plan potential work, and improve our service. We do not sell your personal information."] },
    { title: "Your choices", paragraphs: ["You may request access to, correction of, or deletion of information you have provided by emailing creatiq.digitalsolutions@gmail.com. We will respond to reasonable requests in line with applicable requirements."] },
  ]} />;
}
