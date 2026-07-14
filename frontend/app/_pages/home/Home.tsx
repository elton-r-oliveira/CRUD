'use client'; // esse componente roda no navegador (usa useState, onClick, etc), não no servidor

import { useState, useEffect } from 'react'; // useState guarda dados que mudam na tela, useEffect roda código quando o componente aparece
import { Container, Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Alert, IconButton, Avatar, } from '@mui/material'; // componentes prontos de interface (biblioteca MUI)
import { Edit as EditIcon, Delete as DeleteIcon, } from '@mui/icons-material'; // ícones de editar e deletar

const URL_API = process.env.API_URL || 'http://localhost:3333/api'; // endereço do backend; se não tiver variável de ambiente, usa o localhost

// formato dos dados que vêm do banco (via backend), um usuário da tabela
interface Usuario {
  Id: number; // chave primária, sempre presente com esse nome
  Foto?: string | null; // não faz parte de `colunas` (é tratado à parte, como avatar)
  [campo: string]: any; // Nome, Email, DataCriacao... o nome de cada um vem de `colunas`, não é fixo aqui
}

// formato dos dados que o formulário guarda enquanto o usuário digita
interface DadosFormulario {
  nome: string;
  email: string;
  foto: string | null;
}

export default function Home() {
  const [usuarios, definirUsuarios] = useState<Usuario[]>([]); // lista de usuários que veio do GET, começa vazia
  const [colunas, definirColunas] = useState<{ campo: string; label: string; ordem: number }[]>([]); // nomes das colunas da tabela, também vêm do backend
  const [dadosFormulario, definirDadosFormulario] = useState<DadosFormulario>({ nome: '', email: '', foto: null }); // o que está digitado no formulário agora
  const [idEmEdicao, definirIdEmEdicao] = useState<number | null>(null); // se não for null, quer dizer que estamos editando esse usuário (vira PUT)
  const [carregando, definirCarregando] = useState(false); // true enquanto uma requisição está em andamento
  const [erro, definirErro] = useState(''); // mensagem de erro pra mostrar na tela, vazia quando não tem erro

  useEffect(() => { carregarUsuarios(); }, []); // assim que a página abre (array vazio = só uma vez), busca os usuários no backend

  // ============================================================
  // GET - buscar a lista de usuários no backend
  // ============================================================
  const carregarUsuarios = async () => { // função assíncrona porque precisa esperar a resposta da rede
    try {
      definirCarregando(true); // liga o "carregando" pra mostrar feedback na tela
      const resposta = await fetch(`${URL_API}/usuarios`); // faz a requisição GET pro backend (GET é o padrão do fetch, não precisa dizer o método)
      if (!resposta.ok) throw new Error(`Erro ${resposta.status}`); // se o status HTTP não for 2xx, considera erro
      const dados = await resposta.json(); // converte o corpo da resposta (texto) em objeto JavaScript
      definirColunas(dados.colunas); // guarda as colunas que o backend mandou
      definirUsuarios(dados.usuarios); // guarda os usuários que o backend mandou
    } catch (excecao: any) {
      definirErro(excecao.message); // se algo deu errado (rede, backend fora, etc), mostra a mensagem
    } finally {
      definirCarregando(false); // desliga o "carregando" independente de ter dado certo ou errado
    }
  };

  // ============================================================
  // POST / PUT - criar um usuário novo ou atualizar um existente
  // (o mesmo form serve para os dois casos: se `idEmEdicao` estiver
  // preenchido, vira PUT; senão, vira POST)
  // ============================================================
  const aoEnviarFormulario = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault(); // impede o comportamento padrão do form (recarregar a página)
    definirErro(''); // limpa erro antigo antes de tentar de novo
    try {
      definirCarregando(true);
      const url = idEmEdicao ? `${URL_API}/usuarios/${idEmEdicao}` : `${URL_API}/usuarios`; // com Id na URL = atualizar um específico; sem Id = criar novo
      const metodo = idEmEdicao ? 'PUT' : 'POST'; // decide o verbo HTTP com base se estamos editando ou não
      const resposta = await fetch(url, {
        method: metodo, // diz pro backend se é criação (POST) ou atualização (PUT)
        headers: { 'Content-Type': 'application/json' }, // avisa que o corpo da requisição está em JSON
        body: JSON.stringify(dadosFormulario), // converte o objeto do formulário em texto JSON pra mandar pro backend
      });
      if (!resposta.ok) {
        const dados = await resposta.json(); // pega a mensagem de erro que o backend mandou
        throw new Error(dados.error || `Erro ${resposta.status}`); // usa a mensagem do backend, ou um genérico se não tiver
      }
      definirDadosFormulario({ nome: '', email: '', foto: null }); // limpa o formulário depois de salvar com sucesso
      definirIdEmEdicao(null); // sai do modo edição
      await carregarUsuarios(); // busca a lista atualizada no backend (pra tabela refletir a mudança)
    } catch (excecao: any) {
      definirErro(excecao.message);
    } finally {
      definirCarregando(false);
    }
  };

  // ============================================================
  // DELETE - remover um usuário
  // ============================================================
  const deletarUsuario = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return; // pergunta antes de deletar; se cancelar, para aqui
    try {
      definirCarregando(true);
      await fetch(`${URL_API}/usuarios/${id}`, { method: 'DELETE' }); // manda o Id na URL pro backend saber qual deletar
      await carregarUsuarios(); // atualiza a lista na tela depois de deletar
    } catch (excecao: any) {
      definirErro(excecao.message);
    } finally {
      definirCarregando(false);
    }
  };

  // ============================================================
  // PUT (preparação) - joga os dados do usuário clicado de volta
  // no form e guarda o Id para o próximo envio virar um PUT
  // ============================================================
  const editarUsuario = (usuario: Usuario) => { // não chama a API, só prepara o formulário
    definirDadosFormulario({ nome: usuario.Nome, email: usuario.Email, foto: usuario.Foto ?? null }); // copia os dados do usuário pro formulário
    definirIdEmEdicao(usuario.Id); // guarda o Id; é isso que faz o próximo submit virar PUT em vez de POST
  };

  // ============================================================
  // Auxiliares - não fazem chamada à API, só apoiam a UI
  // ============================================================
  const cancelarEdicao = () => { // botão "Cancelar" no formulário
    definirDadosFormulario({ nome: '', email: '', foto: null }); // limpa o formulário
    definirIdEmEdicao(null); // sai do modo edição, volta a ser um POST
    definirErro(''); // limpa qualquer erro que estivesse na tela
  };

  const aoTrocarFoto = (evento: React.ChangeEvent<HTMLInputElement>) => { // dispara quando o usuário escolhe um arquivo de imagem
    const arquivo = evento.target.files?.[0]; // pega o primeiro arquivo selecionado
    if (!arquivo) return; // se cancelou a escolha, não faz nada
    const leitor = new FileReader(); // API do navegador pra ler o conteúdo do arquivo
    leitor.onloadend = () => definirDadosFormulario(anterior => ({ ...anterior, foto: leitor.result as string })); // quando terminar de ler, guarda a imagem (em base64) no formulário
    leitor.readAsDataURL(arquivo); // começa a leitura, convertendo a imagem pra uma string base64
  };

  const formatarValor = (valor: any) => { // decide como mostrar o valor de uma célula, olhando pro conteúdo (não pro nome da coluna)
    if (valor === null || valor === undefined) return ''; // sem valor, não mostra nada
    const pareceData = typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valor); // string tipo "2026-07-14..." (formato ISO que o SQL Server manda)
    if (!(valor instanceof Date) && !pareceData) return String(valor); // não é data, mostra o valor como texto puro
    const dataConvertida = valor instanceof Date ? valor : new Date(valor); // garante que estamos trabalhando com um objeto Date
    if (isNaN(dataConvertida.getTime())) return String(valor); // data inválida, mostra o valor cru
    return `${String(dataConvertida.getUTCDate()).padStart(2, '0')}/${String(dataConvertida.getUTCMonth() + 1).padStart(2, '0')}/${dataConvertida.getUTCFullYear()}`; // monta dd/mm/aaaa, com zero à esquerda quando precisa
  };

  const colunasOrdenadas = [...colunas].sort((a, b) => a.ordem - b.ordem); // a proc não garante ordem sem ORDER BY, então ordenamos aqui pelo campo `ordem`

  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}> {/* ocupa a tela toda, com respiro em cima e embaixo */}
      <Container maxWidth="sm"> {/* limita a largura do conteúdo, centralizado */}
        <Typography variant="h4" align="center" sx={{ mb: 3 }}>
          CRUD com SQL Server {/* título da página */}
        </Typography>

        {erro && ( // só aparece se `erro` não estiver vazio
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => definirErro('')}>{erro}</Alert> // caixinha vermelha com a mensagem; o X fecha limpando o erro
        )}

        {/* ==================== POST / PUT - form de criação/edição ==================== */}
        <Paper elevation={0} sx={{ p: 3, mb: 3 }}> {/* cartão que envolve o formulário */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            {idEmEdicao ? 'Editar Usuário (PUT)' : 'Novo Usuário (POST)'} {/* muda o título conforme o modo */}
          </Typography>

          <Box component="form" onSubmit={aoEnviarFormulario} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}> {/* ao submeter, chama aoEnviarFormulario */}
            <TextField
              label="Nome" value={dadosFormulario.nome} required fullWidth size="small" // campo controlado: o valor sempre vem do estado
              onChange={(evento) => definirDadosFormulario({ ...dadosFormulario, nome: evento.target.value })} // a cada tecla, atualiza só o campo "nome" no estado
            />
            <TextField
              label="Email" type="email" value={dadosFormulario.email} required fullWidth size="small"
              onChange={(evento) => definirDadosFormulario({ ...dadosFormulario, email: evento.target.value })} // atualiza só o campo "email"
            />

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>Foto (opcional)</Typography>
              <input type="file" accept="image/*" onChange={aoTrocarFoto} /> {/* input nativo de arquivo, só aceita imagens */}
              {dadosFormulario.foto && <Avatar src={dadosFormulario.foto} sx={{ mt: 1 }} />} {/* mostra a prévia se já tiver foto escolhida */}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              {idEmEdicao && ( // botão "Cancelar" só aparece durante a edição
                <Button variant="outlined" onClick={cancelarEdicao}>Cancelar</Button>
              )}
              <Button type="submit" variant="contained" disabled={carregando}> {/* desabilita enquanto tem requisição rodando */}
                {carregando ? 'Processando...' : idEmEdicao ? 'Atualizar' : 'Criar'} {/* texto do botão muda conforme o estado */}
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* ==================== GET - lista de usuários ==================== */}
        <Paper elevation={0} sx={{ p: 3 }}> {/* cartão que envolve a tabela */}
          <Typography variant="h6" sx={{ mb: 2 }}>Lista de Usuários (GET)</Typography>

          {carregando && <Typography color="text.secondary">Carregando...</Typography>} {/* enquanto busca os dados */}

          {!carregando && usuarios.length === 0 && ( // não tem ninguém cadastrado ainda
            <Typography color="text.secondary">Nenhum usuário cadastrado</Typography>
          )}

          {!carregando && usuarios.length > 0 && ( // só desenha a tabela se tiver usuários
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {colunasOrdenadas.map((coluna) => ( // gera um cabeçalho de coluna pra cada item que o backend mandou
                      <TableCell key={coluna.campo}>{coluna.label}</TableCell>
                    ))}
                    {/* coluna fixa de editar/deletar, não vem do backend */}
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usuarios.map((usuario) => ( // uma linha de tabela pra cada usuário da lista; key ajuda o React a identificar cada uma
                    <TableRow key={usuario.Id}>
                      {colunasOrdenadas.map((coluna, indice) => { // uma célula por coluna que a proc descreveu, na mesma ordem do cabeçalho
                        const valor = formatarValor(usuario[coluna.campo]); // pega o valor pelo nome do campo (não hardcoded)
                        return (
                          <TableCell key={coluna.campo} suppressHydrationWarning> {/* suppressHydrationWarning evita aviso quando a formatação de data difere entre servidor e navegador */}
                            {indice === 0 ? ( // a primeira coluna (menor `ordem`) ganha o avatar na frente, como "identidade" da linha
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar src={usuario.Foto ?? undefined} sx={{ width: 32, height: 32 }}>
                                  {!usuario.Foto && valor.charAt(0).toUpperCase()} {/* sem foto, mostra a inicial */}
                                </Avatar>
                                {valor}
                              </Box>
                            ) : valor}
                          </TableCell>
                        );
                      })}
                      <TableCell align="center">
                        {/* PUT - abre o usuário no form para edição */}
                        <IconButton size="small" onClick={() => editarUsuario(usuario)}><EditIcon fontSize="small" /></IconButton>
                        {/* DELETE - remove o usuário */}
                        <IconButton size="small" onClick={() => deletarUsuario(usuario.Id)}><DeleteIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
