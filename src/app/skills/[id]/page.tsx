import { WorkspaceApp } from "@/components/workspace-app";

export default async function SkillDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <WorkspaceApp initialSkillId={id} section="skills" />;
}
