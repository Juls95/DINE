import { SignupForm } from "../components/SignupForm";

export function UpdatesPage() {
  return (
    <section className="page">
      <header className="page-head">
        <h1>Get updates</h1>
        <p>
          The thesis is rebuilt every week from fresh data. Leave an e-mail address or your X username and we will tell you when the verdict, the regime
          or a tripwire changes, and for future contact about NEAR RDC.
        </p>
      </header>
      <SignupForm />
    </section>
  );
}
