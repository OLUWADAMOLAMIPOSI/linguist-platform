import { getProfile, getSettings, socialLinks } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { HtmlContent, PageHeader } from "@/components/ui/common";
import { CollaborationForm, ContactForm } from "@/components/forms/public-forms";

export async function generateMetadata() {
  return buildMetadata({ path: "/contact", title: "Contact and collaboration", description: "Get in touch or propose a collaboration." });
}

export default async function ContactPage() {
  const [settings, profile] = await Promise.all([getSettings(), getProfile()]);
  const links = socialLinks(settings);
  const email = settings.show_email_publicly ? settings.contact_email || profile?.email : null;
  const phone = settings.show_phone_publicly ? settings.phone || profile?.phone : null;

  return (
    <>
      <PageHeader eyebrow="Contact" title="Contact and collaboration" intro="Send a message, or use the collaboration form for research proposals and invitations." />
      <div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-14">
          <section id="contact">
            <h2 className="mb-4 text-2xl">Send a message</h2>
            <ContactForm />
          </section>

          <section id="collaborate">
            <h2 className="mb-1 text-2xl">Research collaboration portal</h2>
            <p className="mb-4 text-sm text-muted">
              For collaboration proposals, joint publications, fieldwork, academic invitations, conference speaking requests and
              supervision enquiries.
            </p>
            <CollaborationForm />
          </section>
        </div>

        <aside className="space-y-8 text-sm">
          <div>
            <p className="eyebrow mb-2">Details</p>
            <dl className="space-y-2">
              {email && (
                <div>
                  <dt className="text-muted">Email</dt>
                  <dd>
                    <a href={`mailto:${email}`} className="link">
                      {email}
                    </a>
                  </dd>
                </div>
              )}
              {phone && (
                <div>
                  <dt className="text-muted">Phone</dt>
                  <dd>{phone}</dd>
                </div>
              )}
              {settings.institution && (
                <div>
                  <dt className="text-muted">Institutional affiliation</dt>
                  <dd>{settings.institution}</dd>
                </div>
              )}
              {settings.address && (
                <div>
                  <dt className="text-muted">Address</dt>
                  <dd className="whitespace-pre-line">{settings.address}</dd>
                </div>
              )}
            </dl>
          </div>

          {links.length > 0 && (
            <div>
              <p className="eyebrow mb-2">Academic profiles</p>
              <ul className="space-y-1.5">
                {links.map((l) => (
                  <li key={l.label}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="link">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {settings.privacy_notice && (
            <div>
              <p className="eyebrow mb-2">Privacy</p>
              <HtmlContent html={settings.privacy_notice} className="prose-academic !text-sm !leading-6" />
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
