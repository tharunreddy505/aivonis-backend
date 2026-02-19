import prisma from './prisma';

export interface Agent {
  id: string;
  userId?: string | null;
  name: string;
  prompt: string;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  gender: 'male' | 'female';
  firstSentence?: string | null;
  transcriptionEmail?: string | null;
  sendEmailAfterCall?: boolean;
  maxCallDuration?: number;
  maxWaitTime?: number;
  createdAt: Date;
  phoneNumber?: string | null;
  companyInfo?: string | null;
  documents?: { id: string; name: string; url: string; size: number; content?: string | null }[];
  documentIds?: string[];
  tools?: {
    id?: string;
    type: string;
    name: string;
    description: string;
    config: string;
    enabled: boolean;
  }[];
}

export async function getAgents(userId?: string, assignedAgentId?: string): Promise<Agent[]> {
  const whereClause: any = {};

  if (userId || assignedAgentId) {
    whereClause.OR = [];
    if (userId) whereClause.OR.push({ userId });
    if (assignedAgentId) whereClause.OR.push({ id: assignedAgentId });
  }

  const agents = await prisma.agent.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: { phoneNumber: true, documents: true, tools: true }
  });
  return agents.map(a => ({
    ...a,
    documents: a.documents.map(d => ({ id: d.id, name: d.name, url: d.url, size: d.size, content: d.content })),
    tools: a.tools.map(t => ({
      id: t.id,
      type: t.type,
      name: t.name,
      description: t.description,
      config: t.config,
      enabled: t.enabled
    })),
    voice: a.voice as any,
    gender: a.gender as any,
    phoneNumber: a.phoneNumber?.phoneNumber || null
  }));
}

export async function createAgent(agentData: Omit<Agent, 'id' | 'createdAt'>): Promise<Agent> {
  const { phoneNumber, documents, documentIds, tools, userId, ...rest } = agentData;

  // Use documentIds if provided, otherwise ignore
  const docsToConnect = documentIds?.map(id => ({ id })) || [];

  const newAgent = await prisma.agent.create({
    data: {
      ...rest,
      userId: userId || null,
      documents: {
        connect: docsToConnect
      },
      tools: {
        create: tools ? tools.map(t => {
          const { id, ...toolData } = t; // Strip out the id field
          return {
            type: toolData.type,
            name: toolData.name,
            description: toolData.description,
            config: toolData.config,
            enabled: toolData.enabled ?? true
          };
        }) : []
      }
    } as any,
    include: { phoneNumber: true, documents: true, tools: true }
  });
  console.log(`[Agents] Created agent: ${newAgent.name} (ID: ${newAgent.id})`);
  return {
    ...newAgent,
    voice: newAgent.voice as any,
    gender: newAgent.gender as any,
    phoneNumber: newAgent.phoneNumber?.phoneNumber || null,
    documents: newAgent.documents.map(d => ({ id: d.id, name: d.name, url: d.url, size: d.size, content: d.content })),
    tools: newAgent.tools.map(t => ({
      id: t.id,
      type: t.type,
      name: t.name,
      description: t.description,
      config: t.config,
      enabled: t.enabled
    }))
  };
}

export async function getAgentById(id: string): Promise<Agent | undefined> {
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: { phoneNumber: true, documents: true, tools: true }
  });
  if (!agent) return undefined;
  return {
    ...agent,
    voice: agent.voice as any,
    gender: agent.gender as any,
    phoneNumber: agent.phoneNumber?.phoneNumber || null,
    documents: agent.documents.map(d => ({ id: d.id, name: d.name, url: d.url, size: d.size, content: d.content })),
    tools: agent.tools.map(t => ({
      id: t.id,
      type: t.type,
      name: t.name,
      description: t.description,
      config: t.config,
      enabled: t.enabled
    }))
  };
}

export async function getAgentByPhoneNumber(phoneNumber: string): Promise<Agent | undefined> {
  // Find the PhoneNumber record first
  const record = await prisma.phoneNumber.findUnique({
    where: { phoneNumber },
    include: { agent: { include: { documents: true, tools: true } } }
  });

  if (!record || !record.agent) return undefined;

  return {
    ...record.agent,
    voice: record.agent.voice as any,
    gender: record.agent.gender as any,
    phoneNumber: record.phoneNumber,
    documents: record.agent.documents.map(d => ({ id: d.id, name: d.name, url: d.url, size: d.size, content: d.content })),
    tools: record.agent.tools.map(t => ({
      id: t.id,
      type: t.type,
      name: t.name,
      description: t.description,
      config: t.config,
      enabled: t.enabled
    }))
  };
}

export async function updateAgent(id: string, updates: Partial<Omit<Agent, 'id' | 'createdAt'>>): Promise<Agent | undefined> {
  try {
    const { phoneNumber, documents, documentIds, tools, userId, ...rest } = updates;

    // Filter out fields that don't exist in the Agent model
    const validFields = [
      'name', 'prompt', 'firstSentence', 'voice', 'gender',
      'transcriptionEmail', 'maxCallDuration', 'maxWaitTime',
      'sendEmailAfterCall', 'companyInfo'
    ];

    const agentData: any = {};
    for (const field of validFields) {
      if (field in rest) {
        agentData[field] = (rest as any)[field];
      }
    }

    // Logic for updating documents:
    // If documentIds is provided, we SET the connections (replace existing).
    const docUpdate = documentIds ? {
      set: documentIds.map(id => ({ id }))
    } : undefined;

    // Handle Tools update - Full replacement for simplicity
    // Only update if tools is explicitly provided (even if empty array)
    const toolsUpdate = tools !== undefined ? {
      deleteMany: {},
      create: tools.map(t => {
        const { id, ...toolData } = t; // Strip out the id field
        return {
          type: toolData.type,
          name: toolData.name,
          description: toolData.description,
          config: toolData.config,
          enabled: toolData.enabled ?? true
        };
      })
    } : undefined;

    const updateData: any = agentData;

    if (docUpdate) {
      updateData.documents = docUpdate;
    }

    if (toolsUpdate) {
      updateData.tools = toolsUpdate;
    }

    const updatedAgent = await prisma.agent.update({
      where: { id },
      data: updateData,
      include: { phoneNumber: true, documents: true, tools: true }
    });
    return {
      ...updatedAgent,
      voice: updatedAgent.voice as any,
      gender: updatedAgent.gender as any,
      phoneNumber: updatedAgent.phoneNumber?.phoneNumber || null,
      documents: updatedAgent.documents.map(d => ({ id: d.id, name: d.name, url: d.url, size: d.size, content: d.content })),
      tools: updatedAgent.tools.map(t => ({
        id: t.id,
        type: t.type,
        name: t.name,
        description: t.description,
        config: t.config,
        enabled: t.enabled
      }))
    };
  } catch (error: any) {
    if (error.code === 'P2025') {
      return undefined;
    }
    console.error(`[Agents] Error updating agent ${id}:`, error);
    throw error;
  }
}

export async function deleteAgent(id: string): Promise<boolean> {
  try {
    await prisma.agent.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error(`[Agents] Error deleting agent ${id}:`, error);
    return false;
  }
}
