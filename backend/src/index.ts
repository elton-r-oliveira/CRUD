import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sql from 'mssql';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// --- Banco de dados ---

let pool: sql.ConnectionPool | null = null;

async function getConnection() {
  if (!pool) {
    pool = await new sql.ConnectionPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '1433'),
      database: process.env.DB_NAME,
      options: { encrypt: true, trustServerCertificate: true },
      pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    }).connect();
    console.log('Conectado ao SQL Server');
  }
  return pool;
}

// --- Rotas ---

app.get(['/api/usuarios', '/api/usuarios/:id'], async (req, res) => {
  const pool = await getConnection();

  if (req.params.id) {
    const id = parseInt(req.params.id as string);
    const result = await pool.request().input('Id', id).execute('s_retorna_lista_usuarios');
    if (!result.recordset.length) return res.status(404).json({ error: 'Usuário não encontrado' });
    return res.json(result.recordset[0]);
  }

  const result = await pool.request().execute('s_retorna_lista_usuarios');
  const recordsets = result.recordsets as sql.IRecordSet<any>[];
  res.json({
    colunas: recordsets[0],
    usuarios: recordsets[1],
  });
});

app.post('/api/usuarios', async (req, res) => {
  const { nome, email, foto } = req.body;
  if (!nome || !email) return res.status(400).json({ error: 'Nome e email são obrigatórios' });
  const pool = await getConnection();
  const result = await pool.request()
    .input('Nome', nome)
    .input('Email', email)
    .input('Foto', sql.NVarChar(sql.MAX), foto ?? null)
    .execute('s_insere_lista_usuarios');
  res.status(201).json({ id: result.recordset[0].Id, nome, email, foto: foto ?? null });
});

app.put('/api/usuarios/:id', async (req, res) => {
  const id = parseInt(req.params.id as string);
  const { nome, email, foto } = req.body;
  if (!nome || !email) return res.status(400).json({ error: 'Nome e email são obrigatórios' });
  const pool = await getConnection();
  const result = await pool.request()
    .input('Id', id)
    .input('Nome', nome)
    .input('Email', email)
    .input('Foto', sql.NVarChar(sql.MAX), foto ?? null)
    .execute('s_atualiza_lista_usuarios');
  if (!result.recordset[0].LinhasAfetadas) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json({ mensagem: 'Usuário atualizado com sucesso' });
});

app.delete('/api/usuarios/:id', async (req, res) => {
  const id = parseInt(req.params.id as string);
  const pool = await getConnection();
  const result = await pool.request().input('Id', id).execute('s_remove_lista_usuarios');
  if (!result.recordset[0].LinhasAfetadas) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json({ mensagem: 'Usuário deletado com sucesso' });
});

// --- Erro global ---

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERRO]', err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
