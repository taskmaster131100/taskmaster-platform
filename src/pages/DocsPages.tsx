import React from 'react';
import DocsViewer from '../components/DocsViewer';

export function ManualUsuario() {
  return (
    <DocsViewer
      docPath="/docs/help/{lang}/manual-usuario.md"
      title="Manual do Usuário"
    />
  );
}

export function ManualEscritorio() {
  return (
    <DocsViewer
      docPath="/docs/help/{lang}/manual-escritorio.md"
      title="Manual Multiartista / Escritório"
    />
  );
}

export function Apresentacao() {
  return (
    <DocsViewer
      docPath="/docs/help/{lang}/apresentacao.md"
      title="Apresentação Oficial"
    />
  );
}

export function Fluxos() {
  return (
    <DocsViewer
      docPath="/docs/help/{lang}/fluxos.md"
      title="Guia de Fluxos por Departamento"
    />
  );
}

export function FAQ() {
  return (
    <DocsViewer
      docPath="/docs/help/{lang}/faq.md"
      title="FAQ - Perguntas Frequentes"
    />
  );
}

export function Changelog() {
  return (
    <DocsViewer
      docPath="/docs/help/{lang}/changelog.md"
      title="Changelog - Histórico de Atualizações"
    />
  );
}
