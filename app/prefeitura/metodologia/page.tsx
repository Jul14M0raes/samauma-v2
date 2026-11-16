'use client';

import { Aviso, Cabecalho, Cartao, Pares, Pino } from '@/components/ui/Basicos';
import { FLUXOS, RESIDUOS } from '@/lib/dominio/catalogo';
import { Parametros } from '@/lib/dominio/parametros';
import { JANELA_EXECUCAO_HORAS } from '@/lib/dominio/catalogo';
import { Fmt } from '@/lib/dominio/formato';
import { useDominio } from '@/state/hooks';

const NATUREZAS: [string, string, string][] = [
  ['declarado', 'Declarado', 'Informado por quem responde pelo resíduo. Vale como declaração, não como prova.'],
  ['medido', 'Medido', 'Aferido em balança, no destino. É o que sustenta o comprovante.'],
  ['calculado', 'Calculado', 'Derivado de outros dois valores por regra explícita, como a taxa de recuperação.'],
  ['comprovado', 'Comprovado por documento', 'Vinculado a documento oficial com a fonte identificada — o MTR emitido no SINIR, com data de emissão e de consulta (RN-027).'],
  ['parametro', 'Parâmetro de trabalho', 'Valor de referência adotado para a demonstração, a ser substituído por medição local.']
];

const FONTES_EXTERNAS: [string, string, string, string][] = [
  ['API de Contratos da Prefeitura', 'api.portovelho.ro.gov.br', 'ligada',
    'Contratos municipais do exercício, consultados ao vivo no painel da Prefeitura. JSON público, sem chave, com CORS liberado.'],
  ['Malha municipal do IBGE', 'servicodados.ibge.gov.br', 'ligada',
    'Limite oficial de Porto Velho desenhado no mapa, em GeoJSON, direto da fonte federal.'],
  ['OpenStreetMap', 'tile.openstreetmap.org', 'ligada',
    'Ruas, rio e referências do mapa base. É a única parte do sistema que exige internet.'],
  ['CNPJ — BrasilAPI / Minha Receita', 'brasilapi.com.br · minhareceita.org', 'ligada',
    'Preenchimento automático do cadastro do gerador a partir do CNPJ: razão social, nome fantasia, situação cadastral e endereço. Reempacotam o mesmo dado público da Receita Federal, sem chave e sem cadastro. Não é a API oficial do Conecta gov.br — essa exige credenciamento de órgão público (e-CPF do gestor, IP liberado, aprovação da RFB), fora do alcance de um protótipo.'],
  ['Portal de Dados Abertos do Município', 'dados.portovelho.ro.gov.br', 'bloqueada',
    'A API CKAN responde e traz empenhos, liquidações e pagamentos, mas não envia cabeçalho de CORS: o navegador não consegue ler direto. Exige um serviço intermediário, que o protótipo não tem.'],
  ['GeoPortal da Prefeitura', 'geoportal.portovelho.ro.gov.br', 'pendente',
    'Não foi localizado endereço público de serviço geográfico padrão (WFS ou REST). Depende de indicação da SMTI para trocar as coordenadas aproximadas pela camada oficial.'],
  ['SNIS — Série Histórica', 'app4.mdr.gov.br', 'pendente',
    'Linha de base municipal de resíduos. Consulta pública por formulário; sem interface programável.'],
  ['SINIR / MTR nacional', 'mtr.sinir.gov.br', 'pendente',
    'Manifesto e certificado de destinação, quando exigíveis. Requer credenciamento de gerador, transportador e destinador.'],
  ['CNPJ — Conecta gov.br (RFB)', 'apigateway.conectagov.estaleiro.serpro.gov.br', 'pendente',
    'Fonte oficial da Receita Federal, com todos os campos do QSA. Acesso restrito a órgão público federal ou estadual credenciado: exige e-CPF do gestor, liberação de IP em firewall e aprovação de governança do Ministério da Gestão e da RFB. Substituiria a BrasilAPI/Minha Receita acima sem mudar nenhuma outra linha do sistema.'],
  ['SEI municipal', 'processo administrativo', 'pendente',
    'Número do processo, tipo documental e dossiê. Requer homologação da unidade gestora e da SMTI.']
];

/* A base legal do SAMAÚMA, agrupada por origem. Cada entrada diz o que a norma
   exige e o que o sistema faz a respeito: citar sem apontar onde responde é
   decoração. A ordem é federal, estadual e municipal, que é como a Procuradoria
   lê. */
const BASE_LEGAL: [string, string, string][] = [

  /* ------------------------------------------------------------- FEDERAL */

  ['Federal', 'Lei nº 12.305/2010 — Política Nacional de Resíduos Sólidos',
    'Obriga o grande gerador a elaborar PGRS (art. 20) e a responder pelo resíduo até a destinação final adequada (art. 21). O art. 36, § 1º manda o titular do serviço priorizar organizações de catadores. O sistema implementa: módulo de PGRS, ciclo rastreado até a unidade receptora e indicador de massa por cooperativa, que é o que permite afirmar priorização com número em vez de intenção.'],

  ['Federal', 'Decreto nº 10.936/2022 — regulamento da PNRS',
    'Substituiu o Decreto nº 7.404/2010 e incorporou o Decreto nº 5.940/2006, da Coleta Seletiva Solidária. É a norma que institui o Manifesto de Transporte de Resíduos em âmbito nacional. O sistema prepara os dados do MTR e concilia o número, sem emiti-lo: a emissão é ato do gerador perante o SINIR.'],

  ['Federal', 'Lei nº 11.445/2007, com a redação da Lei nº 14.026/2020',
    'Marco do saneamento. Define limpeza urbana e manejo de resíduos como serviço público e exige regulação por entidade competente — em Porto Velho, a ARDPV. A Lei nº 14.026/2020 substituiu o SNIS pelo SINISA como sistema nacional de informações. O sistema exporta em formato aberto para alimentar o que o titular precisa reportar.'],

  ['Federal', 'Lei nº 14.129/2021 — Governo Digital',
    'Princípios de interoperabilidade, dados abertos por padrão e não exigir do cidadão informação que a Administração já tem. O sistema responde com exportação em formato aberto sem intermediação, consulta de CNPJ que evita redigitar o que a Receita já publica, e verificação pública por QR sem exigir login.'],

  ['Federal', 'Lei nº 12.527/2011 — Acesso à Informação',
    'Publicidade como regra e sigilo como exceção. Sustenta a página pública de conferência da carteira e da carga: qualquer pessoa confere sem credencial, e o que é dado pessoal de cooperado fica restrito à coordenação da cooperativa.'],

  ['Federal', 'Lei nº 13.709/2018 — LGPD',
    'O Município é controlador e a contratada, operadora (art. 5º). A base legal do tratamento é a execução de política pública (art. 7º, III, e art. 23). O sistema restringe exibição individual de produção e renda ao próprio titular e à coordenação, agrega nos painéis de gestão e não trata dado biométrico.'],

  ['Federal', 'Lei nº 14.133/2021 — Licitações e Contratos',
    'Art. 75, IV, "j" para contratação de solução inovadora, e art. 59, III, que faz da inexequibilidade motivo de desclassificação. O art. 145 veda pagamento antecipado, o que define as duas formas de desembolso da proposta.'],

  ['Federal', 'Lei Complementar nº 182/2021 — Marco Legal das Startups',
    'Institui o Contrato Público para Solução Inovadora (art. 13), com teto de R$ 1,6 milhão e chamamento público. É uma das duas vias possíveis para contratar o piloto.'],

  ['Federal', 'Lei nº 10.973/2004 e Decreto nº 9.283/2018',
    'Encomenda tecnológica (art. 20), que dispensa licitação quando há risco tecnológico declarado — a possibilidade de insucesso ainda que a execução seja diligente. É a segunda via, e a que reconhece que o resultado do piloto não é certo de antemão.'],

  ['Federal', 'Lei nº 5.764/1971 e Lei nº 12.690/2012 — cooperativas',
    'Autonomia da sociedade cooperativa e regime das cooperativas de trabalho. O cooperado trabalha sob a cooperativa, que registra a coleta em nome da equipe; a divisão da produção é matéria de estatuto e de assembleia, fora do sistema.'],

  ['Federal', 'Lei nº 13.019/2014 — MROSC',
    'Regime das parcerias entre a Administração e organizações da sociedade civil, com dever de prestação de contas. Cooperativa que recebe apoio público por termo de fomento presta contas à mão; o sistema já tem o dado bruto para produzir a peça.'],

  ['Federal', 'Lei nº 12.305/2010, art. 33, e Decreto nº 10.388/2020 — logística reversa',
    'O art. 33 obriga fabricante, importador, distribuidor e comerciante a estruturar sistema de logística reversa para agrotóxico, pilha e bateria, pneu, óleo lubrificante, lâmpada e eletroeletrônico; o Decreto nº 10.388/2020 faz o mesmo para medicamento domiciliar. A responsabilidade é de quem põe o produto no mercado, não de quem descarta. O sistema implementa isso mantendo o fluxo em conta separada: a massa recebida pelo estabelecimento aparece como serviço prestado ao sistema setorial e fica fora do indicador de destinação dele.'],

  ['Federal', 'Lei nº 12.305/2010, art. 36, V — compostagem',
    'Põe entre as obrigações do titular do serviço público implantar sistema de compostagem para resíduo sólido orgânico e articular com os agentes econômicos o uso do composto. O sistema trata o orgânico como fluxo próprio, com destino em unidade de compostagem e recuperação medida em composto produzido — e não em material vendido, que é a métrica do reciclável seco.'],

  ['Federal', 'Resolução CONAMA nº 275/2001',
    'Código de cores para a coleta seletiva. Referência para a classificação de material adotada no cadastro e nos relatórios.'],

  ['Federal', 'Resolução CONAMA nº 307/2002 e RDC ANVISA nº 222/2022',
    'Resíduo da construção civil e resíduo de serviços de saúde, cada um com plano e regime próprios. Estão declarados fora do escopo desta fase justamente porque exigem tratamento distinto do resíduo reciclável de grande gerador.'],

  ['Federal', 'Lei nº 9.609/1998 — proteção da propriedade intelectual de software',
    'Regime de proteção do programa de computador, com prazo de cinquenta anos. Fundamenta a cláusula de titularidade da solução e a custódia de código-fonte previstas na minuta de contrato.'],

  /* ----------------------------------------------------------- ESTADUAL */

  ['Estadual', 'Lei nº 4.437/2018 (RO), art. 47',
    'Política Estadual de Governança Climática e Serviços Ambientais. O art. 47 exige que empreendimentos de alta concentração ou circulação de pessoas instalem equipamentos e mantenham programa de coleta seletiva COMO CONDIÇÃO para obter licença ambiental. É um segundo fundamento, estadual e ligado ao licenciamento, para o mesmo público-alvo do decreto municipal.'],

  ['Estadual', 'Instrução Normativa SEDAM nº 5/2025',
    'Diretrizes para os municípios de Rondônia sobre áreas contaminadas por disposição inadequada e cumprimento dos prazos da PNRS. Contextualiza a urgência do dado de destinação verificável.'],

  /* ---------------------------------------------------------- MUNICIPAL */

  ['Municipal', 'Decreto nº 15.603, de 26/11/2018',
    'Cria o Cadastro de Grandes Geradores, considera grande gerador quem produz acima de 100 litros por dia e veda a coleta pública acima de 200 litros por dia, atribuindo ao particular o custo de coleta, transporte e destinação. Institui a obrigatoriedade do PGRS no licenciamento. É a norma central do sistema: o cálculo de enquadramento e a fila de fiscalização derivam dela.'],

  ['Municipal', 'Lei Complementar nº 199/2004, art. 147, § 4º',
    'Referência do enquadramento de volume adotada pelo decreto municipal.'],

  ['Municipal', 'Lei Complementar nº 838/2021 — Plano Diretor Participativo',
    'Estabelece cinco macrozonas (art. 48) e quinze zonas urbanas (art. 62), e no art. 32 põe entre as diretrizes de saneamento a elaboração do Plano Municipal de Gestão Integrada de Resíduos Sólidos e a universalização do manejo de resíduos. O Plano Diretor é declaradamente alinhado aos Objetivos de Desenvolvimento Sustentável. Não menciona catadores nem coleta seletiva: é lacuna que o dado do sistema ajuda a preencher.'],

  ['Municipal', 'Lei Complementar nº 97/1999, alterada pela Lei Complementar nº 965/2023',
    'Parcelamento, uso e ocupação do solo. Define onde cada atividade pode se instalar — inclusive unidade de triagem, que não opera em qualquer zona. O campo de zona do cadastro é o ponto por onde o sistema se liga a esse ordenamento.']

];

export default function PaginaMetodologia() {
  useDominio();

  return (
    <>
      <Cabecalho titulo="Metodologia e fontes" texto="De onde vem cada número, com que natureza e sob qual norma" />

      <Aviso titulo="Nenhum número aparece sem natureza declarada"
        texto="O sistema separa o que foi declarado, o que foi medido em balança, o que foi calculado por regra e o que é parâmetro de trabalho. As quatro naturezas nunca são somadas no mesmo campo." />

      <div className="colunas dois-um">
        <Cartao titulo="Natureza do dado" sub="A regra que atravessa todas as telas"
          corpo={<div className="lista-def">
            {NATUREZAS.map(([id, nome, texto]) => (
              <div className="def" key={id}><Pino rotulo={nome} tom={id === 'medido' ? 'ok' : id === 'parametro' ? 'alerta' : ''} /><p>{texto}</p></div>
            ))}
          </div>} />

        <Cartao titulo="Regras de decisão" sub="Os limiares que o sistema aplica"
          corpo={<Pares itens={[
            ['Tolerância entre observado e aferido', `${Fmt.percentual(Parametros.atual().tolerancia, 0)} ou ${Fmt.kg(Parametros.toleranciaMinimaKg)}, o que for maior (RN-021)`],
            ['Acima da tolerância', 'abre pendência; o Técnico libera ou mantém, com justificativa (RN-022 a RN-025)'],
            ['PGRS a renovar', `${Parametros.antecedenciaPgrsDias} dias antes do vencimento (RN-033)`],
            ['Irregular', 'cadastro incompleto, PGRS não enviado ou vencido, ou inconformidade grave (RN-036, RN-037)'],
            ['Coleta não executada', `a cooperativa justifica e remarca em até ${JANELA_EXECUCAO_HORAS} horas (RN-041)`],
            ['Medições', 'as três medições não mudam depois de registradas (RN-023)']
          ]} />} />
      </div>

      <Cartao titulo="Parâmetros por material" sub="Preço, emissão evitada e perda de triagem — parâmetros de trabalho, não valores oficiais"
        nota={`Tarifa de disposição em aterro adotada: ${Fmt.reais(Parametros.tarifaAterro)} por tonelada. Estes valores sustentam apenas a demonstração. São parâmetros de trabalho, ajustáveis pelo Técnico.`}
        corpo={
          <div className="tabela-rolagem">
            <table className="tabela">
              <thead><tr><th>Material</th><th className="num">Preço por kg</th><th className="num">CO₂e por kg</th><th className="num">Perda na triagem</th><th>Destino</th></tr></thead>
              <tbody>
                {RESIDUOS.map(r => (
                  <tr key={r.id}>
                    <td><span className="ponto-cor" style={{ ['--cor' as string]: r.cor }}></span>{r.nome}</td>
                    <td className="num">{Parametros.preco(r.id) ? Fmt.reais(Parametros.preco(r.id)) : '—'}</td>
                    <td className="num">{r.co2 ? Fmt.numero(r.co2, 1) : '—'}</td>
                    <td className="num">{Fmt.percentual(r.perdaTriagem * 100, 0)}</td>
                    <td>{r.recuperavel ? <span className="pino ok">volta ao ciclo</span> : <span className="pino erro">aterro</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        } />

      <Cartao titulo="Fontes externas e o que consumimos de cada uma" sub="Inclusive o que não foi possível ligar, e por quê"
        nota="O sistema não copia dado de fonte oficial para dentro de si: consulta na hora e mostra a origem. Onde a consulta direta não é possível, a tela diz o motivo em vez de simular o número."
        corpo={
          <div className="tabela-rolagem">
            <table className="tabela">
              <thead><tr><th>Fonte</th><th>Endereço</th><th>Situação</th><th>O que entra ou o que falta</th></tr></thead>
              <tbody>
                {FONTES_EXTERNAS.map(([nome, onde, estado, texto]) => (
                  <tr key={nome}>
                    <td><b>{nome}</b></td>
                    <td><code>{onde}</code></td>
                    <td><span className={`pino ${estado === 'ligada' ? 'ok' : estado === 'bloqueada' ? 'erro' : 'alerta'}`}>{estado}</span></td>
                    <td>{texto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        } />

      <Cartao titulo="Base legal" sub={`${BASE_LEGAL.length} instrumentos, do federal ao municipal`}
        nota="Cada norma vem com o que ela exige e o que o sistema faz a respeito. A decisão administrativa permanece no processo oficial: o sistema organiza a evidência, não notifica, não autua e não substitui o SEI."
        corpo={<div className="lista-def">
          {['Federal', 'Estadual', 'Municipal'].map(origem => (
            <div key={origem}>
              <Pino rotulo={origem} tom="neutro" />
              {BASE_LEGAL.filter(([o]) => o === origem).map(([, norma, texto]) => (
                <div className="def" key={norma}><b>{norma}</b><p>{texto}</p></div>
              ))}
            </div>
          ))}
        </div>} />

      <Cartao titulo="Origem dos dados territoriais" sub="O que é real e o que é aproximado"
        nota="Substituir a tabela de pontos pela camada oficial do GeoPortal não altera nenhuma outra parte do sistema: todo o resto lê o ponto pelo identificador."
        corpo={<Pares itens={[
          ['Bairros e zonas', 'reais, de Porto Velho'],
          ['Ruas e rio no mapa', 'OpenStreetMap, reais'],
          ['Coordenadas dos pontos de coleta', 'aproximadas — não vêm do GeoPortal municipal'],
          ['Estabelecimentos, pessoas e documentos', 'fictícios'],
          ['Massas e valores da demonstração', 'gerados por cenário, com semente fixa']
        ]} />} />

      {/* Os quatro fluxos e por que não se somam. É a distinção jurídica de
          que dependem todos os indicadores de massa do sistema. */}
      <Cartao titulo="Quatro fluxos, quatro regimes" sub="Por que não existe um número único de recuperação do município"
        nota="Somar os quatro produziria um percentual que não corresponde a obrigação de ninguém. O sistema apura cada fluxo em separado e diz, em cada um, o que a palavra recuperação significa ali."
        corpo={<div className="lista-def">
          {FLUXOS.map(f => (
            <div className="def" key={f.id}>
              <b style={{ color: f.cor }}>{f.nome}</b>
              <p>{f.regime}</p>
              <p className="ajuda">
                Responsável: {f.responsavel}. Recuperação: {f.recuperacao.toLowerCase()}. {f.baseLegal}
              </p>
            </div>
          ))}
        </div>} />

      {/* A distinção que separa este sistema de um sistema de coleta. Fica na
          metodologia, e não só nas telas, porque é dela que decorre o que o
          Município pode afirmar publicamente sem se expor. */}
      <Cartao titulo="Coletar, destinar e reciclar são três afirmações diferentes"
        sub="E o sistema mantém as três separadas"
        nota="Somar as duas taxas num número só seria a forma mais fácil de melhorar o indicador e a mais fácil de perder uma auditoria. Por isso elas aparecem sempre lado a lado, com a origem declarada."
        corpo={<div className="lista-def">
          <div className="def"><b>Declarado</b><p>O volume, em litros, que o gerador informou ao declarar a coleta (RN-006).</p></div>
          <div className="def"><b>Coletado</b><p>A massa que a cooperativa observou na coleta. Vale como declaração de quem carregou.</p></div>
          <div className="def"><b>Destinado</b><p>O que a balança da unidade receptora pesou, com identificação do instrumento e tíquete quando existe. É o que o comprovante certifica: o material chegou a uma unidade licenciada.</p></div>
          <div className="def"><b>Recuperado</b><p>Estimado pela tabela de perda de triagem de cada material. O que acontece com o material depois do recebimento fica fora do piloto (RN-035), e por isso o número é sempre apresentado como estimativa.</p></div>
          <div className="def"><b>Perda evitável e perda inerente</b><p>Todo material perde algo na triagem. O que o sistema atribui ao gerador é só a diferença entre a carga que ele mandou e a mesma carga se tivesse vindo separada — a perda que existiria de qualquer forma não entra na conta dele.</p></div>
        </div>} />

      {/* Protótipo declarado é protótipo honesto. Estas três peças existem
          para demonstrar arquitetura antes da implantação, e dizer isso na
          própria tela é o que impede que virem promessa. */}
      <Cartao titulo="O que está aqui como protótipo" sub="Funciona, demonstra a arquitetura, e não está ligado ao mundo real"
        nota="A distinção importa para o contrato: o que está nesta lista é o que a implantação oficial vai ligar às fontes reais. Nenhuma dessas peças exige refazer o sistema — em todas, a troca é da fonte do dado, não da regra."
        corpo={<div className="lista-def">
          <div className="def"><b>Leitura direta da balança</b><p>O botão lê de um instrumento simulado, com identificação, aferição e número de registro. Demonstra o que muda na força da prova quando o número não passa pelo teclado de quem recebe a carga. Na implantação, a simulação dá lugar à leitura da porta serial ou de rede do instrumento — o resto do sistema não muda.</p></div>
          <div className="def"><b>Conciliação de MTR</b><p>Cruza o arquivo exportado do SINIR com as cargas registradas e aponta manifesto sem carga, carga sem manifesto e massa divergente. Não há consulta ao SINIR: não existe interface programável pública. Com credenciamento do órgão, a mesma conciliação passa a receber a lista por consulta.</p></div>
          <div className="def"><b>Orgânico</b><p>O fluxo está modelado com regime, responsável e destinação próprios, e aparece separado nos indicadores. A implantação acrescenta o cadastro real das unidades de compostagem.</p></div>
        </div>} />

      <Cartao titulo="O que o sistema ainda não faz" sub="Declarado por escolha, não por esquecimento"
        corpo={<div className="lista-def">
          <div className="def"><b>Não emite ato administrativo</b><p>A minuta de notificação é peça para revisão e assinatura da autoridade. O sistema não notifica, não dá prazo e não constitui ninguém em mora.</p></div>
          <div className="def"><b>Não emite o MTR nem consulta o SINIR</b><p>A emissão é do gerador, em mtr.sinir.gov.br. O sistema monta o rascunho do manifesto, guarda o número e concilia por arquivo exportado — não substitui o sistema nacional e não tem interface programável com ele.</p></div>
          <div className="def"><b>Não preenche o código da Lista Brasileira de Resíduos</b><p>A classe pela NBR 10004 é sugerida como parâmetro de trabalho, mas o código depende da caracterização do resíduo e da atividade do gerador. Preencher por conta própria induziria a erro em documento com valor legal.</p></div>
          <div className="def"><b>Não autentica pelo gov.br</b><p>Depende de credenciamento do órgão no Login Único do governo federal. O acesso hoje é por código.</p></div>
          <div className="def"><b>Não movimenta dinheiro</b><p>Não é meio de pagamento, não emite nota fiscal, não registra venda de material e não é sistema de cobrança (RN-018, RN-019).</p></div>
          <div className="def"><b>Não cobre todos os fluxos de resíduo</b><p>Cobre reciclável seco, orgânico e rejeito de grande gerador. Ficam de fora (RN-032): resíduo de serviço de saúde, construção civil, logística reversa especializada e coleta domiciliar comum.</p></div>
          <div className="def"><b>Não emite selo nem aplica penalidade</b><p>O selo de regularidade depende de validação jurídica do município (RN-030) e nenhuma penalidade é automática (RN-031).</p></div>
        </div>} />
    </>
  );
}
