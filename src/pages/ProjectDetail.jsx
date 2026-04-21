import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/shared/PageHeader';
import HealthBadge from '@/components/shared/HealthBadge';
import { getFaseLabel, getStatusLabel } from '@/lib/constants';
import ProjectOverview from '@/components/project/ProjectOverview';
import ProjectActivities from '@/components/project/ProjectActivities';
import ProjectTeam from '@/components/project/ProjectTeam';
import ProjectTimeline from '@/components/project/ProjectTimeline';

export default function ProjectDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = window.location.pathname.split('/projects/')[1];
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => base44.entities.Project.list().then(ps => ps.find(p => p.id === projectId)),
    enabled: !!projectId,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 200),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.update(projectId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
  });

  if (isLoading) return <div className="flex items-center justify-center py-20 lg:pl-0 pl-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!project) return <div className="text-center py-20 lg:pl-0 pl-12">Projeto não encontrado</div>;

  const client = clients.find(c => c.id === project.client_id);

  return (
    <div className="space-y-6 lg:pl-0 pl-12">
      <div className="flex items-center gap-4">
        <Link to="/projects" className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <HealthBadge saude={project.saude} size="md" />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {client?.razao_social || '-'} • {getFaseLabel(project.fase_atual)} • {getStatusLabel(project.status)}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="activities">Atividades</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="timeline">Cronograma</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ProjectOverview project={project} client={client} onUpdate={(data) => updateMutation.mutate(data)} />
        </TabsContent>
        <TabsContent value="activities">
          <ProjectActivities projectId={projectId} />
        </TabsContent>
        <TabsContent value="team">
          <ProjectTeam projectId={projectId} />
        </TabsContent>
        <TabsContent value="timeline">
          <ProjectTimeline project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}