class LocalDatabase {
  private getStorageKey(collection: string): string {
    return `taskmaster_${collection}`;
  }

  private log(action: string, collection: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      action,
      collection,
      data: data ? { id: data.id, name: data.name || data.artisticName || 'N/A' } : null
    };
    console.log(`[TaskMaster DB] ${action}:`, logEntry);

    // Store logs for monitoring
    const logs = this.getLogs();
    logs.push(logEntry);
    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.shift();
    }
    try {
      localStorage.setItem('taskmaster_logs', JSON.stringify(logs));
    } catch (e) {
      console.warn('Could not save logs:', e);
    }
  }

  getLogs(): any[] {
    try {
      const logs = localStorage.getItem('taskmaster_logs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      return [];
    }
  }

  clearLogs() {
    localStorage.removeItem('taskmaster_logs');
    console.log('[TaskMaster DB] Logs cleared');
  }

  getCollection<T>(collection: string): T[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(collection));
      const parsed = data ? JSON.parse(data) : [];
      this.log('READ', collection, { count: parsed.length });
      return parsed;
    } catch (error) {
      console.error(`[TaskMaster DB] Error loading collection ${collection}:`, error);
      return [];
    }
  }

  setCollection<T>(collection: string, data: T[]): void {
    try {
      localStorage.setItem(this.getStorageKey(collection), JSON.stringify(data));
      this.log('WRITE', collection, { count: data.length });
    } catch (error) {
      console.error(`[TaskMaster DB] Error saving collection ${collection}:`, error);
    }
  }

  createProject(projectData: any) {
    const projects = this.getCollection<any>('projects');
    const newProject = {
      id: `project_${Date.now()}`,
      ...projectData,
      createdAt: new Date().toISOString()
    };
    projects.push(newProject);
    this.setCollection('projects', projects);
    this.log('CREATE', 'projects', newProject);
    console.log('✅ [TaskMaster] Projeto criado com sucesso:', newProject.name);
    return newProject;
  }

  updateProject(projectId: string, updates: any) {
    const projects = this.getCollection<any>('projects');
    const index = projects.findIndex((p: any) => p.id === projectId);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates, updatedAt: new Date().toISOString() };
      this.setCollection('projects', projects);
      this.log('UPDATE', 'projects', projects[index]);
      console.log('✅ [TaskMaster] Projeto atualizado:', projects[index].name);
      return projects[index];
    }
    return null;
  }

  deleteProject(projectId: string) {
    const projects = this.getCollection<any>('projects');
    const filtered = projects.filter((p: any) => p.id !== projectId);
    this.setCollection('projects', filtered);
    this.log('DELETE', 'projects', { id: projectId });
    console.log('🗑️ [TaskMaster] Projeto deletado:', projectId);
  }

  createArtist(artistData: any) {
    const artists = this.getCollection<any>('artists');
    const newArtist = {
      id: `artist_${Date.now()}`,
      ...artistData,
      createdAt: new Date().toISOString()
    };
    artists.push(newArtist);
    this.setCollection('artists', artists);
    this.log('CREATE', 'artists', newArtist);
    console.log('✅ [TaskMaster] Artista criado com sucesso:', newArtist.name);
    return newArtist;
  }

  updateArtist(artistId: string, updates: any) {
    const artists = this.getCollection<any>('artists');
    const index = artists.findIndex((a: any) => a.id === artistId);
    if (index !== -1) {
      artists[index] = { ...artists[index], ...updates, updatedAt: new Date().toISOString() };
      this.setCollection('artists', artists);
      this.log('UPDATE', 'artists', artists[index]);
      console.log('✅ [TaskMaster] Artista atualizado:', artists[index].name);
      return artists[index];
    }
    return null;
  }

  deleteArtist(artistId: string) {
    const artists = this.getCollection<any>('artists');
    const filtered = artists.filter((a: any) => a.id !== artistId);
    this.setCollection('artists', filtered);
    this.log('DELETE', 'artists', { id: artistId });
    console.log('🗑️ [TaskMaster] Artista deletado:', artistId);
  }

  createTask(taskData: any) {
    const tasks = this.getCollection<any>('tasks');
    const newTask = {
      id: `task_${Date.now()}`,
      ...taskData,
      createdAt: new Date().toISOString()
    };
    tasks.push(newTask);
    this.setCollection('tasks', tasks);
    this.log('CREATE', 'tasks', newTask);
    console.log('✅ [TaskMaster] Tarefa criada com sucesso:', newTask.title || newTask.name);
    return newTask;
  }

  updateTask(taskId: string, updates: any) {
    const tasks = this.getCollection<any>('tasks');
    const index = tasks.findIndex((t: any) => t.id === taskId);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date().toISOString() };
      this.setCollection('tasks', tasks);
      this.log('UPDATE', 'tasks', tasks[index]);
      console.log('✅ [TaskMaster] Tarefa atualizada:', tasks[index].title || tasks[index].name);
      return tasks[index];
    }
    return null;
  }

  deleteTask(taskId: string) {
    const tasks = this.getCollection<any>('tasks');
    const filtered = tasks.filter((t: any) => t.id !== taskId);
    this.setCollection('tasks', filtered);
    this.log('DELETE', 'tasks', { id: taskId });
    console.log('🗑️ [TaskMaster] Tarefa deletada:', taskId);
  }

  // Validação de persistência
  validatePersistence(): { success: boolean; report: any } {
    console.log('🔍 [TaskMaster] Iniciando validação de persistência...');

    const report = {
      timestamp: new Date().toISOString(),
      collections: {} as any,
      totalRecords: 0,
      storageUsed: 0,
      status: 'unknown'
    };

    const collections = ['projects', 'artists', 'tasks', 'departments', 'teamMembers'];

    collections.forEach(collection => {
      const data = this.getCollection(collection);
      report.collections[collection] = {
        count: data.length,
        sampleRecord: data.length > 0 ? data[0] : null
      };
      report.totalRecords += data.length;
    });

    // Calculate storage usage
    let storageSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('taskmaster_')) {
        const value = localStorage.getItem(key);
        storageSize += key.length + (value?.length || 0);
      }
    }
    report.storageUsed = storageSize;

    // Check if localStorage is working
    try {
      const testKey = 'taskmaster_test_persistence';
      const testValue = JSON.stringify({ test: true, timestamp: Date.now() });
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved === testValue) {
        report.status = 'healthy';
        console.log('✅ [TaskMaster] Persistência validada com sucesso!');
        console.log(`📊 [TaskMaster] Total de registros: ${report.totalRecords}`);
        console.log(`💾 [TaskMaster] Uso de storage: ${(storageSize / 1024).toFixed(2)} KB`);
        return { success: true, report };
      } else {
        report.status = 'corrupted';
        console.error('❌ [TaskMaster] Dados corrompidos detectados!');
        return { success: false, report };
      }
    } catch (error) {
      report.status = 'error';
      console.error('❌ [TaskMaster] Erro ao validar persistência:', error);
      return { success: false, report };
    }
  }

  // Backup completo
  createBackup(): string {
    console.log('💾 [TaskMaster] Criando backup completo...');

    const backup = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      data: {} as any
    };

    const collections = ['projects', 'artists', 'tasks', 'departments', 'teamMembers'];
    collections.forEach(collection => {
      backup.data[collection] = this.getCollection(collection);
    });

    const backupString = JSON.stringify(backup);
    console.log('✅ [TaskMaster] Backup criado:', {
      size: `${(backupString.length / 1024).toFixed(2)} KB`,
      collections: Object.keys(backup.data).length,
      totalRecords: Object.values(backup.data).reduce((acc: number, arr: any) => acc + arr.length, 0)
    });

    return backupString;
  }

  // Restaurar backup
  restoreBackup(backupString: string): boolean {
    try {
      console.log('🔄 [TaskMaster] Restaurando backup...');
      const backup = JSON.parse(backupString);

      if (!backup.version || !backup.data) {
        throw new Error('Formato de backup inválido');
      }

      Object.keys(backup.data).forEach(collection => {
        this.setCollection(collection, backup.data[collection]);
      });

      console.log('✅ [TaskMaster] Backup restaurado com sucesso!');
      this.log('RESTORE_BACKUP', 'system', { version: backup.version });
      return true;
    } catch (error) {
      console.error('❌ [TaskMaster] Erro ao restaurar backup:', error);
      return false;
    }
  }

  // Limpar tudo (cuidado!)
  clearAll() {
    console.warn('⚠️ [TaskMaster] Limpando todos os dados...');
    const collections = ['projects', 'artists', 'tasks', 'departments', 'teamMembers'];
    collections.forEach(collection => {
      localStorage.removeItem(this.getStorageKey(collection));
    });
    this.log('CLEAR_ALL', 'system', null);
    console.log('🗑️ [TaskMaster] Todos os dados foram limpos');
  }

  cleanup() {
    // Optional cleanup logic
    console.log('🧹 [TaskMaster] Cleanup executado');
  }

  // Estatísticas
  getStats() {
    const stats = {
      projects: this.getCollection<any>('projects').length,
      artists: this.getCollection<any>('artists').length,
      tasks: this.getCollection<any>('tasks').length,
      departments: this.getCollection<any>('departments').length,
      teamMembers: this.getCollection<any>('teamMembers').length,
      logs: this.getLogs().length
    };

    console.table(stats);
    return stats;
  }
}

export const localDatabase = new LocalDatabase();

// Exportar função global para debugging no console
if (typeof window !== 'undefined') {
  (window as any).taskmaster_db = localDatabase;
  console.log('🔧 [TaskMaster] Database disponível globalmente via: window.taskmaster_db');
}
