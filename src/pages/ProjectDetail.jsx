import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HealthBadge from '@/components/shared/HealthBadge';
import { getFaseLabel, getStatusLabel } from '@/lib/constants';
import ProjectOverview from '@/components/project/ProjectOverview';
import ProjectActivities from '@/components/project/ProjectActivities';
import ProjectTeam from '@/components/project/ProjectTeam';
import ProjectTimeline from '@/components/project/ProjectTimeline';
import ProjectDocuments from '@/components/project/ProjectDocuments';
import ProjectStatusReports from '@/components/project/ProjectStatusReports';
import ProjectHistorico from '@/components/project/ProjectHistorico';
import ProjectAuditoria from '@/components/project/ProjectAuditoria';
import ProjectModules from '@/components/project/ProjectModules';
import DocumentForm from '@/pages/DocumentForm';
import ActivityFormDialog from '@/components/activities/ActivityFormDialog';

const projectId = window.location.pathname.split('/projects/')[1];

export default function ProjectDetail() {
  const queryClient = useQueryClient();
  const [openDoc, setOpenDoc] = useState(null); // { tipo, doc }
  const [showNewActivity, setShowNewActivity] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => base44.entities.Project.filter({ id: projectId }, '-created_date', 1).then(ps => ps[0]),
    enabled: !!projectId,
    staleTime: 30_000,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 200),
    staleTime: 120_000,
  });

  // Lazy: só carrega quando o dialog de nova atividade está aberto
  const { data: consultants = [] } = useQuery({
    queryKey: ['consultants'],
    queryFn: () => base44.entities.Consultant.list('-created_date', 100),
    staleTime: 120_000,
    enabled: showNewActivity,
  });

  const { data: allProjects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
    staleTime: 60_000,
    enabled: showNewActivity,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.update(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const createActivityMutation = useMutation({
    mutationFn: (data) => base44.entities.Activity.create({ ...data, project_id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', projectId] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setShowNewActivity(false);
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 lg:pl-0 pl-12">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!project) return <div className="text-center py-20 lg:pl-0 pl-12">Projeto não encontrado</div>;

  const client = clients.find(c => c.id === project.client_id);

  // If a document is open, show the form inline
  if (openDoc) {
    return (
      <div className="lg:pl-0 pl-12">
        <DocumentForm
          projectId={projectId}
          tipo={openDoc.tipo}
          docId={openDoc.doc?.id}
          onClose={() => setOpenDoc(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:pl-0 pl-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/projects" className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold truncate">{project.name}</h1>
            <HealthBadge saude={project.saude} size="md" />
            {project.prioritario && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Prioritário
              </span>
            )}
            {project.bloqueia_go_live && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                Bloqueia Go Live
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {client?.razao_social || '-'} · {getFaseLabel(project.fase_atual)} · {getStatusLabel(project.status)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="bg-muted/50 p-1 h-auto inline-flex gap-1 w-max">
            <TabsTrigger value="overview" className="text-xs">Visão Geral</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs">Documentos</TabsTrigger>
            <TabsTrigger value="activities" className="text-xs">Atividades</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs">Status Reports</TabsTrigger>
            <TabsTrigger value="team" className="text-xs">Equipe</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs">Cronograma</TabsTrigger>
            <TabsTrigger value="historico" className="text-xs">Histórico</TabsTrigger>
            <TabsTrigger value="modulos" className="text-xs">Project</TabsTrigger>
            <TabsTrigger value="auditoria" className="text-xs">Auditoria</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <ProjectOverview project={project} client={client} onUpdate={(data) => updateMutation.mutate(data)} />
        </TabsContent>

        <TabsContent value="documents">
          <ProjectDocuments
            projectId={projectId}
            onOpenDoc={(tipo, doc) => setOpenDoc({ tipo, doc })}
          />
        </TabsContent>

        <TabsContent value="activities">
          <ProjectActivities projectId={projectId} />
        </TabsContent>

        <TabsContent value="reports">
          <ProjectStatusReports projectId={projectId} project={project} />
        </TabsContent>

        <TabsContent value="team">
          <ProjectTeam projectId={projectId} />
        </TabsContent>

        <TabsContent value="timeline">
          <ProjectTimeline project={project} />
        </TabsContent>

        <TabsContent value="historico">
          <ProjectHistorico project={project} />
        </TabsContent>

        <TabsContent value="modulos">
          <ProjectModules projectId={projectId} project={project} />
        </TabsContent>

        <TabsContent value="auditoria">
          <ProjectAuditoria project={project} />
        </TabsContent>
      </Tabs>

      <ActivityFormDialog
        open={showNewActivity}
        onOpenChange={(o) => { if (!o) setShowNewActivity(false); }}
        activity={null}
        projects={allProjects}
        consultants={consultants}
        onSubmit={(data) => createActivityMutation.mutate(data)}
        isLoading={createActivityMutation.isPending}
      />
    </div>
  );
}