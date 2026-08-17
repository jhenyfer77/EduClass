const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = 3000;

// Configurações essenciais para receber dados de formulários (Login/Cadastro)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cria ou conecta ao arquivo do banco de dados
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado com sucesso ao Banco de Dados SQLite.');
    }
});

// Cria todas as tabelas do sistema de uma vez só
db.serialize(() => {
    // 1. Tabela de Usuários (Gestores e Professores)
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        tipo TEXT CHECK(tipo IN ('gestor', 'professor')) NOT NULL
    )`);

    // 2. Tabela de Recados (Mural de Avisos)
    db.run(`CREATE TABLE IF NOT EXISTS recados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        conteudo TEXT NOT NULL,
        autor TEXT NOT NULL,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 3. Tabela de Calendário (Eventos da Escola)
    db.run(`CREATE TABLE IF NOT EXISTS eventos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        data_evento TEXT NOT NULL,
        descricao TEXT
    )`);

    // 4. Tabela de Planejamento de Aula (Preenchido pelo Professor)
    db.run(`CREATE TABLE IF NOT EXISTS planejamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        materia TEXT NOT NULL,
        conteudo TEXT NOT NULL,
        data_planejada TEXT NOT NULL
    )`);
});

// Rota para a página de login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para processar o Login
app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], (err, usuario) => {
        if (err) {
            return res.status(500).send('Erro no servidor.');
        }
        if (!usuario || String(usuario.senha).trim() !== String(senha).trim()) {
            return res.send('<h2>E-mail ou senha incorretos! <a href="/">Tentar novamente</a></h2>');
        }

        if (usuario.tipo === 'gestor') {
            res.sendFile(path.join(__dirname, 'public', 'gestor.html'));
        } else {
            res.sendFile(path.join(__dirname, 'public', 'professor.html'));
        }
    });
});

// 1. Rota para o Gestor cadastrar um novo Professor
app.post('/cadastrar-professor', (req, res) => {
    const { nome, email, senha } = req.body;
    db.run(`INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, 'professor')`, 
        [nome, email, senha], (err) => {
            if (err) return res.send('<h2>Erro: E-mail já cadastrado! <a href="/gestor.html">Voltar</a></h2>');
            res.redirect('/gestor.html');
        }
    );
});

// 2. Rota para salvar um Novo Recado (Mural)
app.post('/criar-recado', (req, res) => {
    const { titulo, conteudo, autor } = req.body;
    db.run(`INSERT INTO recados (titulo, conteudo, autor) VALUES (?, ?, ?)`, 
        [titulo, conteudo, autor], (err) => {
            if (err) return res.status(500).send('Erro ao salvar recado.');
            res.redirect('/gestor.html');
        }
    );
});

// 3. Rota para salvar um Novo Evento (Calendário)
app.post('/criar-evento', (req, res) => {
    const { titulo, data_evento, descricao } = req.body;
    db.run(`INSERT INTO eventos (titulo, data_evento, descricao) VALUES (?, ?, ?)`, 
        [titulo, data_evento, descricao], (err) => {
            if (err) return res.status(500).send('Erro ao salvar evento.');
            res.redirect('/gestor.html');
        }
    );
});

// 4. Rota para o Professor salvar um Planejamento de Aula
app.post('/criar-planejamento', (req, res) => {
    const { materia, conteudo, data_planejada } = req.body;
    db.run(`INSERT INTO planejamentos (materia, conteudo, data_planejada) VALUES (?, ?, ?)`, 
        [materia, conteudo, data_planejada], (err) => {
            if (err) return res.status(500).send('Erro ao salvar planejamento.');
            res.redirect('/professor.html');
        }
    );
});

// Rota auxiliar para criar usuários de teste padrão
app.get('/criar-usuarios-teste', (req, res) => {
    db.run(`INSERT OR IGNORE INTO usuarios (nome, email, senha, tipo) VALUES 
        ('Diretor', 'diretor@escola.com', '123456', 'gestor'),
        ('Ana', 'ana@escola.com', '123456', 'professor')`, 
        () => res.send('<h2>Usuários de teste recriados! <a href="/">Ir para o Login</a></h2>')
    );
});

// Inicializa o servidor
app.listen(PORT, () => {
    console.log(`EduClass rodando em http://localhost:${PORT}`);
});
