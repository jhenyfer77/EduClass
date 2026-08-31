const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session'); // 1. Adicionado o módulo de sessão que você instalou

const app = express();
const PORT = 3000;

// 2. Configuração da Sessão no Servidor
app.use(session({
    secret: 'chave-secreta-educlass', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Configurações essenciais para receber dados de formulários e JSON
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

    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        tipo TEXT CHECK(tipo IN ('gestor', 'professor')) NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS recados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        conteudo TEXT NOT NULL,
        autor TEXT NOT NULL,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS eventos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        data_evento TEXT NOT NULL,
        descricao TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS planejamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        materia TEXT NOT NULL,
        conteudo TEXT NOT NULL,
        data_planejada TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS alunos (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        nome TEXT NOT NULL,

        turma TEXT NOT NULL

    )`);
});

// Rota para a página de login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para processar o Login (Atualizada com a Opção A e com Sessão)
app.post('/login', (req, res) => {
    const { email, senha } = req.body; // Usa "senha" pois você alterou o HTML para "senha"

    db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], (err, usuario) => {
        if (err) {
            return res.status(500).send('Erro no servidor.');
        }
        if (!usuario || String(usuario.senha).trim() !== String(senha).trim()) {
            return res.send('<h2>E-mail ou senha incorretos! <a href="/">Tentar novamente</a></h2>');
        }

        // 3. Guarda quem logou na memória do servidor
        req.session.usuarioLogado = {
            id: usuario.id,
            nome: usuario.nome,
            tipo: usuario.tipo
        };

        if (usuario.tipo === 'gestor') {
            res.redirect('/gestor.html');
        } else {
            res.redirect('/professor.html');
        }
    });
});

// Rota para processar o Cadastro de novos usuários
app.post('/cadastro', (req, res) => {
    const { name, email, password, userType } = req.body;

    if (!name || !email || !password || !userType) {
        return res.send('<h2>Erro: Preencha todos os campos! <a href="/">Voltar</a></h2>');
    }

    db.run(
        `INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)`, 
        [name, email, password, userType], 
        (err) => {
            if (err) {
                return res.send('<h2>Erro: Este e-mail já está cadastrado! <a href="/">Voltar e tentar outro</a></h2>');
            }
            res.send('<h2>Cadastro realizado com sucesso! <a href="/">Clique aqui para fazer login</a></h2>');
        }
    );
});

// 4. Rota Nova: Para deslogar do sistema de forma segura
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.send('Erro ao sair do sistema.');
        }
        res.redirect('/'); 
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
            if (err) return res.status(500).json({ erro: 'Erro ao salvar recado.' });
            res.json({ mensagem: 'Recado salvo com sucesso!' });
        }
    );
});

// 3. Rota para salvar um Novo Evento (Calendário)
app.post('/criar-evento', (req, res) => {
    const { titulo, data_evento, descricao } = req.body;
    db.run(`INSERT INTO eventos (titulo, data_evento, descricao) VALUES (?, ?, ?)`, 
        [titulo, data_evento, descricao], (err) => {
            if (err) return res.status(500).json({ erro: 'Erro ao salvar evento.' });
            res.json({ mensagem: 'Evento salvo com sucesso!' });
        }
    );
});

// 4. ROTAS DO PROFESSOR (Criar, Listar e Deletar Planejamentos)
app.post('/criar-planejamento', (req, res) => {
    const { materia, conteudo, data_planejada } = req.body;
    db.run(`INSERT INTO planejamentos (materia, conteudo, data_planejada) VALUES (?, ?, ?)`, 
        [materia, conteudo, data_planejada], (err) => {
            if (err) return res.status(500).json({ erro: 'Erro ao salvar planejamento.' });
            res.json({ mensagem: 'Planejamento salvo com sucesso!' });
        }
    );
});

app.get('/listar-planejamentos', (req, res) => {
    db.all(`SELECT * FROM planejamentos ORDER BY data_planejada ASC`, [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

app.delete('/apagar-planejamento/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM planejamentos WHERE id = ?`, [id], (err) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ mensagem: 'Planejamento apagado com sucesso!' });
    });
});

// Rotas de listagem gerais
app.get('/listar-recados', (req, res) => {
    db.all(`SELECT * FROM recados ORDER BY data_criacao DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

app.get('/listar-eventos', (req, res) => {
    db.all(`SELECT * FROM eventos ORDER BY data_evento ASC`, [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

// Rota para cadastrar um novo aluno

app.post('/cadastrar-aluno', (req, res) => {

    const { nome, turma } = req.body;

    if (!nome || !turma) {

        return res.status(400).json({

            erro: 'Nome e turma são obrigatórios.'

        });

    }

    db.run(

        `INSERT INTO alunos (nome, turma) VALUES (?, ?)`,

        [nome, turma],

        (err) => {

            if (err) {

                console.error('ERRO AO CADASTRAR ALUNO:', err);
            
                
            
                return res.status(500).json({
            
                    erro: err.message
            
                });
            
            }

            res.json({

                mensagem: 'Aluno cadastrado com sucesso!'

            });

        }

    );

});

// Rotas de exclusão gerais
app.delete('/apagar-recado/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM recados WHERE id = ?`, [id], (err) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ mensagem: 'Recado apagado com sucesso!' });
    });
});

app.delete('/apagar-evento/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM eventos WHERE id = ?`, [id], (err) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ mensagem: 'Evento apagado com sucesso!' });
    });
});

// Rota auxiliar para criar usuários de teste padrão
app.get('/criar-usuarios-teste', (req, res) => {
    db.run(`INSERT OR IGNORE INTO usuarios (nome, email, senha, tipo) VALUES 
        ('Diretor', 'diretor@escola.com', '123456', 'gestor'),
        ('Ana', 'ana@escola.com', '123456', 'professor')`, 
        () => res.send('<h2>Usuários de teste recriados! <a href="/">Ir para o Login</a></h2>')
    );
});

// Rota para o Gestor ver o total de professores, recados e eventos
app.get('/contadores-gestor', (req, res) => {
    db.get(`SELECT COUNT(*) AS total FROM usuarios WHERE tipo = 'professor'`, [], (err, rowProf) => {
        if (err) return res.status(500).json({ erro: err.message });
        db.get(`SELECT COUNT(*) AS total FROM recados`, [], (err, rowRec) => {
            if (err) return res.status(500).json({ erro: err.message });
            db.get(`SELECT COUNT(*) AS total FROM eventos`, [], (err, rowEve) => {
                if (err) return res.status(500).json({ erro: err.message });
                res.json({
                    professores: rowProf.total,
                    recados: rowRec.total,
                    eventos: rowEve.total
                });
            });
        });
    });
});

// Nova rota para deletar um professor pelo painel do gestor
app.delete('/apagar-professor/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM usuarios WHERE id = ?`, [id], (err) => {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }
        res.json({ mensagem: 'Professor removido com sucesso!' });
    });
});

// Inicialização do servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
