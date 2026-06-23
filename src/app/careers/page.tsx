import { ContentPage } from "@/components/site/content-page";

export default function CareersPage() {
  return <ContentPage eyebrow="Careers" title="Build thoughtful digital work with us." intro="Creatiq is always interested in meeting curious designers, developers, and creative problem-solvers who care about useful, well-crafted work." sections={[
    { title: "What we value", paragraphs: ["We value clear thinking, collaborative work, and the patience to turn a rough idea into a genuinely useful digital product."] },
    { title: "Open opportunities", paragraphs: ["There are no published roles right now, but we welcome introductions from people working in web development, UI/UX, branding, graphic design, content, and digital strategy."] },
    { title: "Introduce yourself", paragraphs: ["Send your portfolio, preferred role, and a short note about the kind of work you enjoy to creatiq.digitalsolutions@gmail.com. We will keep strong profiles in mind as projects and roles become available."] },
  ]} />;
}
