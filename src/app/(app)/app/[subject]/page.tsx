interface SubjectPageProps {
  params: { subject: string };
}

export default function SubjectPage({ params }: SubjectPageProps) {
  return (
    <main>
      <h1>{params.subject} ページ</h1>
      <p>ここは /app/{params.subject} です</p>
    </main>
  );
}
