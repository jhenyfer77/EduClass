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

// Cria a tabela de usuários (Gestores e Professores) se ela não existir
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        tipo TEXT CHECK(tipo IN ('gestor', 'professor')) NOT NULL
    )`);
});

// Rota para a página de login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ROTA DE LOGIN ATUALIZADA
app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    db.get(`SELECT * FROM usuarios WHERE email = ? AND senha = ?`, [email, senha], (err, usuario) => {
        if (err) {
            return res.status(500).send('Erro no servidor.');
        }
        if (!usuario) {
            return res.send('<h2>E-mail ou senha incorretos! <a href="/">Tentar novamente</a></h2>');
        }

        // REDIRECIONAMENTO REAL PARA OS ARQUIVOS HTML
        if (usuario.tipo === 'gestor') {
            res.sendFile(path.join(__dirname, 'public', 'gestor.html'));
        } else {
            res.sendFile(path.join(__dirname, 'public', 'professor.html'));
        }
    });
});

// ROTA PARA CADASTRAR UM NOVO PROFESSOR (Executada pelo Gestor)
app.post('/cadastrar-professor', (req, res) => {
    const { nome, email, senha } = req.body;
    const tipo = 'professor'; // Garante que o cadastro feito aqui sempre será professor

    db.run(`INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)`, 
        [nome, email, senha, tipo], 
        (err) => {
            if (err) {
                // Se o e-mail já existir, o SQLite vai dar erro porque configuramos como UNIQUE
                return res.send('<h2>Erro: Este e-mail já está cadastrado! <a href="/gestor.html">Voltar</a></h2>');
            }
            // Se der certo, mostra mensagem e um link para voltar ao painel
            res.send('<h2>Professor cadastrado com sucesso! <a href="/gestor.html">Voltar ao Painel</a></h2>');
        }
    );
});


// ROTA AUXILIAR PARA CRIAR USUÁRIOS DE TESTE (Rode no navegador para testar)
// Acesse: http://localhost:3000/criar-usuarios-teste
app.get('/criar-usuarios-teste', (req, res) => {
    db.serialize(() => {
        // Cria um Gestor de teste
        db.run(`INSERT OR IGNORE INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)`, 
            ['Diretor Carlos', 'diretor@escola.com', '123456', 'gestor']);
        
        // Cria un Professor de teste
        db.run(`INSERT OR IGNORE INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)`, 
            ['Professora Ana', 'ana@escola.com', '123456', 'professor']);
    });
    res.send('<h1>Usuários de teste criados com sucesso!</h1><p>Gestor: diretor@escola.com (senha: 123456)</p><p>Professor: ana@escola.com (senha: 123456)</p><a href="/">Ir para o Login</a>');
});


app.listen(PORT, () => {
    console.log(`EduClass rodando em http://localhost:${PORT}`);
});
