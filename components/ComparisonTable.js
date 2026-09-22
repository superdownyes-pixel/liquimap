import React from 'react';

const ComparisonTable = () => {
  const features = [
    { name: 'Instalação', bookmap: 'Software Java Pesado', liquimap: '100% Cloud (Navegador)' },
    { name: 'Análise de Fluxo', bookmap: 'Manual e Complexa', liquimap: 'Inteligência Artificial Nativa' },
    { name: 'Cálculo de Lote', bookmap: 'Não possui / Plugins', liquimap: 'LiquiMind Copilot Integrado' },
    { name: 'Acesso Mobile', bookmap: 'Inexistente / Limitado', liquimap: 'Totalmente Responsivo' },
    { name: 'Curva de Aprendizado', bookmap: 'Semanas de Estudo', liquimap: 'Interface Intuitiva (HUD)' },
    { name: 'Preço', bookmap: 'Elevado (em Dólar)', liquimap: 'Acessível e em Real' },
  ];

  return (
    <section id="comparativo" className="py-24 bg-[#050a0f] relative overflow-hidden">
      {/* Decoração de Fundo */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px]" />

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Por que escolher a <span className="text-cyan-400">Liquimap?</span>
          </h2>
          <p className="text-slate-400">A evolução da leitura de fluxo chegou.</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="p-6 text-slate-400 font-medium uppercase text-xs tracking-widest">Recurso</th>
                <th className="p-6 text-slate-400 font-medium uppercase text-xs tracking-widest text-center">Bookmap</th>
                <th className="p-6 text-cyan-400 font-bold uppercase text-xs tracking-widest text-center bg-cyan-400/5">Liquimap IA</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="p-6 text-slate-300 font-medium">{f.name}</td>
                  <td className="p-6 text-slate-500 text-center">{f.bookmap}</td>
                  <td className="p-6 text-white text-center font-bold bg-cyan-400/5">
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                      {f.liquimap}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 italic">
            * Dados baseados na versão desktop padrão do competidor vs. Liquimap v1.0.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ComparisonTable;
