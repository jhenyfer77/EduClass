const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = 3000;

// =====================================================
// CONFIGURAÇÕES
// =====================================================

app.use(session({
    secret: 'chave-secreta-educlass',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false
    }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));


// =====================================================
// BANCO DE DADOS
// =====================================================

const db = new sqlite3.Database('./database.db', (err) => {

    if (err) {

        console.error(
            'Erro ao conectar ao banco:',
            err.message
        );

    } else {

        console.log(
            'Conectado com sucesso ao Banco de Dados SQLite.'
        );

    }

});


// =====================================================
// CRIAÇÃO DAS TABELAS
// =====================================================

db.serialize(() => {

    // USUÁRIOS
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL,
            tipo TEXT CHECK(tipo IN ('gestor', 'professor')) NOT NULL
        )
    `);


    // RECADOS
    db.run(`
        CREATE TABLE IF NOT EXISTS recados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            conteudo TEXT NOT NULL,
            autor TEXT NOT NULL,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);


    // EVENTOS
    db.run(`
        CREATE TABLE IF NOT EXISTS eventos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            data_evento TEXT NOT NULL,
            descricao TEXT
        )
    `);


    // PLANEJAMENTOS
    db.run(`
        CREATE TABLE IF NOT EXISTS planejamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            materia TEXT NOT NULL,
            conteudo TEXT NOT NULL,
            data_planejada TEXT NOT NULL
        )
    `);


    // ALUNOS
    db.run(`
        CREATE TABLE IF NOT EXISTS alunos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            turma TEXT NOT NULL
        )
    `);


    // FREQUÊNCIAS
    db.run(`
        CREATE TABLE IF NOT EXISTS frequencias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            aluno_id INTEGER NOT NULL,
            turma TEXT NOT NULL,
            status TEXT NOT NULL,
            data_chamada DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);


    // RELATÓRIOS
    db.run(`
        CREATE TABLE IF NOT EXISTS relatorios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            aluno_id INTEGER NOT NULL,
            aluno_nome TEXT NOT NULL,
            turma TEXT NOT NULL,
            professor TEXT,
            conteudo TEXT NOT NULL,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

});


// =====================================================
// LOGIN
// =====================================================

app.get('/', (req, res) => {

    res.sendFile(
        path.join(__dirname, 'public', 'index.html')
    );

});


app.post('/login', (req, res) => {

    const {
        email,
        senha
    } = req.body;


    db.get(
        `SELECT * FROM usuarios WHERE email = ?`,
        [email],
        (err, usuario) => {

            if (err) {

                return res.status(500).send(
                    'Erro no servidor.'
                );

            }


            if (
                !usuario ||
                String(usuario.senha).trim() !==
                String(senha).trim()
            ) {

                return res.send(`
                    <h2>
                        E-mail ou senha incorretos!
                    </h2>

                    <a href="/">
                        Tentar novamente
                    </a>
                `);

            }


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

        }
    );

});


// =====================================================
// CADASTRO DE USUÁRIO
// =====================================================

app.post('/cadastro', (req, res) => {

    const {
        name,
        email,
        password,
        userType
    } = req.body;


    if (
        !name ||
        !email ||
        !password ||
        !userType
    ) {

        return res.send(`
            <h2>
                Erro: Preencha todos os campos!
            </h2>

            <a href="/">
                Voltar
            </a>
        `);

    }


    db.run(
        `
        INSERT INTO usuarios
        (nome, email, senha, tipo)
        VALUES (?, ?, ?, ?)
        `,
        [
            name,
            email,
            password,
            userType
        ],
        (err) => {

            if (err) {

                return res.send(`
                    <h2>
                        Erro: Este e-mail já está cadastrado!
                    </h2>

                    <a href="/">
                        Voltar
                    </a>
                `);

            }


            res.send(`
                <h2>
                    Cadastro realizado com sucesso!
                </h2>

                <a href="/">
                    Fazer login
                </a>
            `);

        }
    );

});


// =====================================================
// LOGOUT
// =====================================================

app.get('/logout', (req, res) => {

    req.session.destroy((err) => {

        if (err) {

            return res.send(
                'Erro ao sair do sistema.'
            );

        }

        res.redirect('/');

    });

});


// =====================================================
// PROFESSOR - CADASTRAR PROFESSOR
// =====================================================

app.post('/cadastrar-professor', (req, res) => {

    const {
        nome,
        email,
        senha
    } = req.body;


    db.run(
        `
        INSERT INTO usuarios
        (nome, email, senha, tipo)
        VALUES (?, ?, ?, 'professor')
        `,
        [
            nome,
            email,
            senha
        ],
        (err) => {

            if (err) {

                return res.send(`
                    <h2>
                        Erro: E-mail já cadastrado!
                    </h2>

                    <a href="/gestor.html">
                        Voltar
                    </a>
                `);

            }


            res.redirect('/gestor.html');

        }
    );

});


// =====================================================
// RECADOS
// =====================================================

app.post('/criar-recado', (req, res) => {

    const {
        titulo,
        conteudo,
        autor
    } = req.body;


    db.run(
        `
        INSERT INTO recados
        (titulo, conteudo, autor)
        VALUES (?, ?, ?)
        `,
        [
            titulo,
            conteudo,
            autor
        ],
        (err) => {

            if (err) {

                return res.status(500).json({
                    erro: 'Erro ao salvar recado.'
                });

            }


            res.json({
                mensagem: 'Recado salvo com sucesso!'
            });

        }
    );

});


app.get('/listar-recados', (req, res) => {

    db.all(
        `
        SELECT *
        FROM recados
        ORDER BY data_criacao DESC
        `,
        [],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    erro: err.message
                });

            }


            res.json(rows);

        }
    );

});


app.delete('/apagar-recado/:id', (req, res) => {

    const {
        id
    } = req.params;


    db.run(
        `DELETE FROM recados WHERE id = ?`,
        [id],
        (err) => {

            if (err) {

                return res.status(500).json({
                    erro: err.message
                });

            }


            res.json({
                mensagem: 'Recado apagado com sucesso!'
            });

        }
    );

});


// =====================================================
// EVENTOS
// =====================================================

app.post('/criar-evento', (req, res) => {

    const {
        titulo,
        data_evento,
        descricao
    } = req.body;


    db.run(
        `
        INSERT INTO eventos
        (titulo, data_evento, descricao)
        VALUES (?, ?, ?)
        `,
        [
            titulo,
            data_evento,
            descricao
        ],
        (err) => {

            if (err) {

                return res.status(500).json({
                    erro: 'Erro ao salvar evento.'
                });

            }


            res.json({
                mensagem: 'Evento salvo com sucesso!'
            });

        }
    );

});


app.get('/listar-eventos', (req, res) => {

    db.all(
        `
        SELECT *
        FROM eventos
        ORDER BY data_evento ASC
        `,
        [],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    erro: err.message
                });

            }


            res.json(rows);

        }
    );

});


app.delete('/apagar-evento/:id', (req, res) => {

    const {
        id
    } = req.params;


    db.run(
        `DELETE FROM eventos WHERE id = ?`,
        [id],
        (err) => {

            if (err) {

                return res.status(500).json({
                    erro: err.message
                });

            }


            res.json({
                mensagem: 'Evento apagado com sucesso!'
            });

        }
    );

});


// =====================================================
// PLANEJAMENTOS
// =====================================================

app.post('/criar-planejamento', (req, res) => {

    const {
        materia,
        conteudo,
        data_planejada
    } = req.body;


    db.run(
        `
        INSERT INTO planejamentos
        (materia, conteudo, data_planejada)
        VALUES (?, ?, ?)
        `,
        [
            materia,
            conteudo,
            data_planejada
        ],
        (err) => {

            if (err) {

                return res.status(500).json({
                    erro: 'Erro ao salvar planejamento.'
                });

            }


            res.json({
                mensagem: 'Planejamento salvo com sucesso!'
            });

        }
    );

});


app.get('/listar-planejamentos', (req, res) => {

    db.all(
        `
        SELECT *
        FROM planejamentos
        ORDER BY data_planejada ASC
        `,
        [],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    erro: err.message
                });

            }


            res.json(rows);

        }
    );

});


app.delete('/apagar-planejamento/:id', (req, res) => {

    const {
        id
    } = req.params;


    db.run(
        `DELETE FROM planejamentos WHERE id = ?`,
        [id],
        (err) => {

            if (err) {

                return res.status(500).json({
                    erro: err.message
                });

            }


            res.json({
                mensagem: 'Planejamento apagado com sucesso!'
            });

        }
    );

});


// =====================================================
// ALUNOS
// =====================================================

// CADASTRAR ALUNO
app.post('/cadastrar-aluno', (req, res) => {

    const {
        nome,
        turma
    } = req.body;


    if (!nome || !turma) {

        return res.status(400).json({
            erro: 'Nome e turma são obrigatórios.'
        });

    }


    db.run(
        `
        INSERT INTO alunos
        (nome, turma)
        VALUES (?, ?)
        `,
        [
            nome,
            turma
        ],
        function(err) {

            if (err) {

                console.error(
                    'ERRO AO CADASTRAR ALUNO:',
                    err.message
                );

                return res.status(500).json({
                    erro: err.message
                });

            }


            res.json({
                mensagem: 'Aluno cadastrado com sucesso!',
                id: this.lastID
            });

        }
    );

});


// =====================================================
// LISTAR ALUNOS
// =====================================================
//
// AQUI ESTÁ A CORREÇÃO PRINCIPAL.
//
// Se a chamada mandar:
// /listar-alunos?turma=3C
//
// serão mostrados SOMENTE os alunos da 3C.
//
// Se não mandar turma,
// mostra todos os alunos.
// =====================================================

app.get('/listar-alunos', (req, res) => {

    const turma = req.query.turma;


    console.log(
        'TURMA SELECIONADA:',
        turma
    );


    if (turma) {

        db.all(
            `
            SELECT id, nome, turma
            FROM alunos
            WHERE TRIM(turma) = TRIM(?)
            ORDER BY nome ASC
            `,
            [turma],
            (err, rows) => {

                if (err) {

                    console.error(
                        'ERRO AO LISTAR ALUNOS:',
                        err.message
                    );

                    return res.status(500).json({
                        erro: err.message
                    });

                }


                console.log(
                    'ALUNOS DA TURMA:',
                    rows
                );


                res.json(rows);

            }
        );

    } else {

        db.all(
            `
            SELECT id, nome, turma
            FROM alunos
            ORDER BY turma ASC, nome ASC
            `,
            [],
            (err, rows) => {

                if (err) {

                    console.error(
                        'ERRO AO LISTAR ALUNOS:',
                        err.message
                    );

                    return res.status(500).json({
                        erro: err.message
                    });

                }


                console.log(
                    'TODOS OS ALUNOS:',
                    rows
                );


                res.json(rows);

            }
        );

    }

});


// =====================================================
// CHAMADA
// =====================================================

app.post('/registrar-chamada', (req, res) => {

    const {
        turma,
        chamada
    } = req.body;


    if (
        !turma ||
        !Array.isArray(chamada) ||
        chamada.length === 0
    ) {

        return res.status(400).json({
            erro: 'Turma e chamada são obrigatórios.'
        });

    }


    const stmt = db.prepare(`
        INSERT INTO frequencias
        (aluno_id, turma, status)
        VALUES (?, ?, ?)
    `);


    chamada.forEach(item => {

        stmt.run(
            item.aluno_id,
            turma,
            item.status
        );

    });


    stmt.finalize(err => {

        if (err) {

            console.error(
                'ERRO AO REGISTRAR CHAMADA:',
                err.message
            );

            return res.status(500).json({
                erro: err.message
            });

        }


        res.json({
            mensagem: 'Chamada registrada com sucesso!'
        });

    });

});


// =====================================================
// RELATÓRIOS
// =====================================================

app.post('/criar-relatorio', (req, res) => {

    const {
        aluno_id,
        aluno_nome,
        turma,
        professor,
        conteudo
    } = req.body;


    if (
        !aluno_id ||
        !aluno_nome ||
        !turma ||
        !conteudo
    ) {

        return res.status(400).json({
            erro: 'Preencha todos os campos obrigatórios.'
        });

    }


    db.run(
        `
        INSERT INTO relatorios
        (
            aluno_id,
            aluno_nome,
            turma,
            professor,
            conteudo
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            aluno_id,
            aluno_nome,
            turma,
            professor || '',
            conteudo
        ],
        (err) => {

            if (err) {

                console.error(
                    'ERRO AO CRIAR RELATÓRIO:',
                    err.message
                );

                return res.status(500).json({
                    erro: 'Erro ao criar relatório.'
                });

            }


            res.json({
                mensagem:
                    'Relatório enviado para a gestão com sucesso!'
            });

        }
    );

});


// =====================================================
// GESTOR - CONTADORES
// =====================================================

app.get('/contadores-gestor', (req, res) => {

    db.get(
        `
        SELECT COUNT(*) AS total
        FROM usuarios
        WHERE tipo = 'professor'
        `,
        [],
        (err, professores) => {

            if (err) {

                return res.status(500).json({
                    erro: err.message
                });

            }


            db.get(
                `
                SELECT COUNT(*) AS total
                FROM recados
                `,
                [],
                (err, recados) => {

                    if (err) {

                        return res.status(500).json({
                            erro: err.message
                        });

                    }


                    db.get(
                        `
                        SELECT COUNT(*) AS total
                        FROM eventos
                        `,
                        [],
                        (err, eventos) => {

                            if (err) {

                                return res.status(500).json({
                                    erro: err.message
                                });

                            }


                            res.json({

                                professores:
                                    professores.total,

                                recados:
                                    recados.total,

                                eventos:
                                    eventos.total

                            });

                        }
                    );

                }
            );

        }
    );

});


// =====================================================
// APAGAR PROFESSOR
// =====================================================

app.delete('/apagar-professor/:id', (req, res) => {

    const {
        id
    } = req.params;


    db.run(
        `
        DELETE FROM usuarios
        WHERE id = ?
        `,
        [id],
        (err) => {

            if (err) {

                return res.status(500).json({
                    erro: err.message
                });

            }


            res.json({
                mensagem:
                    'Professor removido com sucesso!'
            });

        }
    );

});


// =====================================================
// USUÁRIOS DE TESTE
// =====================================================

app.get('/criar-usuarios-teste', (req, res) => {

    db.run(
        `
        INSERT OR IGNORE INTO usuarios
        (nome, email, senha, tipo)
        VALUES
        ('Diretor', 'diretor@escola.com', '123456', 'gestor'),
        ('Ana', 'ana@escola.com', '123456', 'professor')
        `,
        () => {

            res.send(`
                <h2>
                    Usuários de teste criados!
                </h2>

                <a href="/">
                    Ir para o Login
                </a>
            `);

        }
    );

});


// =====================================================
// INICIAR SERVIDOR
// =====================================================

app.listen(PORT, () => {

    console.log(
        `Servidor rodando em http://localhost:${PORT}`
    );

});