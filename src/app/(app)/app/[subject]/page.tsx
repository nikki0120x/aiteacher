interface SubjectPageProps {
  params: { subject: string };
}

export default function SubjectPage({ params }: SubjectPageProps) {
  return (
    <>
      <h1>{params.subject} ページ</h1>
      <p>ここは /app/{params.subject} です</p>
    </>
  );
}
