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

    saveUninitialized: false,

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

        console.error('Erro ao conectar ao banco:', err.message);

    } else {

        console.log('Conectado com sucesso ao Banco de Dados SQLite.');

    }

});

// =====================================================

// FUNÇÃO PARA FINALIZAR O SERVIDOR

// =====================================================

function iniciarServidor() {

    app.listen(PORT, () => {

        console.log(`Servidor rodando em http://localhost:${PORT}`);

    });

}

// =====================================================

// MIGRAÇÕES

// =====================================================

const migrations = [

    ['recados', 'escola_id', 'INTEGER'],

    ['eventos', 'escola_id', 'INTEGER'],

    ['planejamentos', 'escola_id', 'INTEGER'],

    ['alunos', 'escola_id', 'INTEGER'],

    ['frequencias', 'escola_id', 'INTEGER'],

    ['relatorios', 'escola_id', 'INTEGER'],

    ['relatorios', 'status', "TEXT DEFAULT 'Pendente'"],

    ['relatorios', 'providencia', 'TEXT'],

    ['relatorios', 'observacao_gestao', 'TEXT'],

    ['relatorios', 'lido_gestao', 'INTEGER DEFAULT 0']

];

function executarMigracoes(callback) {

    let indice = 0;

    function proximaMigracao() {

        if (indice >= migrations.length) {

            return callback(null);

        }

        const [table, column, definition] = migrations[indice];

        indice++;

        db.all(

            `PRAGMA table_info(${table})`,

            (err, columns) => {

                if (err) {

                    return callback(err);

                }

                const existe = columns.some(

                    coluna => coluna.name === column

                );

                if (existe) {

                    return proximaMigracao();

                }

                console.log(

                    `Criando coluna ${table}.${column}...`

                );

                db.run(

                    `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`,

                    (alterErr) => {

                        if (alterErr) {

                            return callback(alterErr);

                        }

                        proximaMigracao();

                    }

                );

            }

        );

    }

    proximaMigracao();

}

// =====================================================

// MIGRAR DADOS ANTIGOS PARA ESCOLA A

// =====================================================

function migrarDadosAntigos(callback) {

    db.get(

        `

        SELECT id, nome, codigo

        FROM escolas

        WHERE codigo = 'EDU-001'

        `,

        (err, escolaA) => {

            if (err) {

                return callback(err);

            }

            if (!escolaA) {

                return callback(

                    new Error('Escola A (EDU-001) não foi encontrada.')

                );

            }

            const tabelas = [

                'alunos',

                'recados',

                'eventos',

                'planejamentos',

                'frequencias',

                'relatorios'

            ];

            let indice = 0;

            function migrarProximaTabela() {

                if (indice >= tabelas.length) {

                    return callback(null);

                }

                const tabela = tabelas[indice];

                indice++;

                db.run(

                    `

                    UPDATE ${tabela}

                    SET escola_id = ?

                    WHERE escola_id IS NULL

                    `,

                    [escolaA.id],

                    function(updateErr) {

                        if (updateErr) {

                            return callback(updateErr);

                        }

                        if (this.changes > 0) {

                            console.log(

                                `${this.changes} registro(s) antigo(s) de ${tabela} foram vinculados à Escola A.`

                            );

                        }

                        migrarProximaTabela();

                    }

                );

            }

            migrarProximaTabela();

        }

    );

}

// =====================================================

// PREPARAR BANCO

// =====================================================

function prepararBanco() {

    // =================================================

    // GARANTIR ESCOLA A

    // =================================================

    db.run(

        `

        INSERT OR IGNORE INTO escolas

        (nome, codigo)

        VALUES ('Escola A', 'EDU-001')

        `,

        (err) => {

            if (err) {

                console.error(

                    'Erro criando Escola A:',

                    err.message

                );

                process.exit(1);

            }

            // =================================================

            // GARANTIR ESCOLA B

            // =================================================

            db.run(

                `

                INSERT OR IGNORE INTO escolas

                (nome, codigo)

                VALUES ('Escola B', 'EDU-002')

                `,

                (err) => {

                    if (err) {

                        console.error(

                            'Erro criando Escola B:',

                            err.message

                        );

                        process.exit(1);

                    }

                    // =================================================

                    // CORRIGIR NOMES DAS ESCOLAS

                    // =================================================

                    db.run(

                        `

                        UPDATE escolas

                        SET nome = 'Escola A'

                        WHERE codigo = 'EDU-001'

                        `,

                        (err) => {

                            if (err) {

                                console.error(err.message);

                                process.exit(1);

                            }

                            db.run(

                                `

                                UPDATE escolas

                                SET nome = 'Escola B'

                                WHERE codigo = 'EDU-002'

                                `,

                                (err) => {

                                    if (err) {

                                        console.error(err.message);

                                        process.exit(1);

                                    }

                                    // =================================================

                                    // MIGRAÇÕES

                                    // =================================================

                                    executarMigracoes(

                                        (migrationErr) => {

                                            if (migrationErr) {

                                                console.error(

                                                    'Erro nas migrações:',

                                                    migrationErr.message

                                                );

                                                process.exit(1);

                                            }

                                            // =================================================

                                            // USUÁRIOS ANTIGOS SEM ESCOLA

                                            // VÃO PARA A ESCOLA A

                                            // =================================================

                                            db.get(

                                                `

                                                SELECT id

                                                FROM escolas

                                                WHERE codigo = 'EDU-001'

                                                `,

                                                (err, escolaA) => {

                                                    if (err || !escolaA) {

                                                        console.error(

                                                            'Não foi possível encontrar a Escola A.'

                                                        );

                                                        process.exit(1);

                                                    }

                                                    db.run(

                                                        `

                                                        INSERT OR IGNORE INTO usuario_escolas

                                                        (usuario_id, escola_id)

                                                        SELECT

                                                            usuarios.id,

                                                            ?

                                                        FROM usuarios

                                                        WHERE NOT EXISTS (

                                                            SELECT 1

                                                            FROM usuario_escolas

                                                            WHERE usuario_escolas.usuario_id = usuarios.id

                                                        )

                                                        `,

                                                        [escolaA.id],

                                                        (err) => {

                                                            if (err) {

                                                                console.error(

                                                                    'Erro vinculando usuários antigos:',

                                                                    err.message

                                                                );

                                                                process.exit(1);

                                                            }

                                                            // =================================================

                                                            // DADOS ANTIGOS

                                                            // =================================================

                                                            migrarDadosAntigos(

                                                                (dataErr) => {

                                                                    if (dataErr) {

                                                                        console.error(

                                                                            'Erro migrando dados antigos:',

                                                                            dataErr.message

                                                                        );

                                                                        process.exit(1);

                                                                    }

                                                                    console.log(

                                                                        'Banco de dados preparado com sucesso.'

                                                                    );

                                                                    console.log(

                                                                        'Dados antigos sem escola foram vinculados à Escola A.'

                                                                    );

                                                                    iniciarServidor();

                                                                }

                                                            );

                                                        }

                                                    );

                                                }

                                            );

                                        }

                                    );

                                }

                            );

                        }

                    );

                }

            );

        }

    );

}

// =====================================================

// CRIAÇÃO DAS TABELAS

// =====================================================

db.serialize(() => {

    // =====================================================

    // USUÁRIOS

    // =====================================================

    db.run(`

        CREATE TABLE IF NOT EXISTS usuarios (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            nome TEXT NOT NULL,

            email TEXT UNIQUE NOT NULL,

            senha TEXT NOT NULL,

            tipo TEXT CHECK(tipo IN ('gestor', 'professor')) NOT NULL

        )

    `);

    // =====================================================

    // ESCOLAS

    // =====================================================

    db.run(`

        CREATE TABLE IF NOT EXISTS escolas (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            nome TEXT NOT NULL,

            codigo TEXT UNIQUE NOT NULL

        )

    `);

    // =====================================================

    // USUÁRIOS ↔ ESCOLAS

    // =====================================================

    db.run(`

        CREATE TABLE IF NOT EXISTS usuario_escolas (

            usuario_id INTEGER NOT NULL,

            escola_id INTEGER NOT NULL,

            PRIMARY KEY (usuario_id, escola_id),

            FOREIGN KEY (usuario_id)

                REFERENCES usuarios(id),

            FOREIGN KEY (escola_id)

                REFERENCES escolas(id)

        )

    `);

    // =====================================================

    // RECADOS

    // =====================================================

    db.run(`

        CREATE TABLE IF NOT EXISTS recados (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            titulo TEXT NOT NULL,

            conteudo TEXT NOT NULL,

            autor TEXT NOT NULL,

            escola_id INTEGER,

            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP

        )

    `);

    // =====================================================

    // EVENTOS

    // =====================================================

    db.run(`

        CREATE TABLE IF NOT EXISTS eventos (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            titulo TEXT NOT NULL,

            data_evento TEXT NOT NULL,

            descricao TEXT,

            escola_id INTEGER

        )

    `);

    // =====================================================

    // PLANEJAMENTOS

    // =====================================================

    db.run(`

        CREATE TABLE IF NOT EXISTS planejamentos (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            materia TEXT NOT NULL,

            conteudo TEXT NOT NULL,

            data_planejada TEXT NOT NULL,

            escola_id INTEGER

        )

    `);

    // =====================================================

    // ALUNOS

    // =====================================================

    db.run(`

        CREATE TABLE IF NOT EXISTS alunos (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            nome TEXT NOT NULL,

            turma TEXT NOT NULL,

            escola_id INTEGER

        )

    `);

    // =====================================================

    // FREQUÊNCIAS

    // =====================================================

    db.run(`

        CREATE TABLE IF NOT EXISTS frequencias (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            aluno_id INTEGER NOT NULL,

            turma TEXT NOT NULL,

            status TEXT NOT NULL,

            escola_id INTEGER,

            data_chamada DATETIME DEFAULT CURRENT_TIMESTAMP

        )

    `);

    // =====================================================

    // NOTAS

    // =====================================================
 
    db.run(`

        CREATE TABLE IF NOT EXISTS notas (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            aluno_id INTEGER NOT NULL,

            turma TEXT NOT NULL,

            nota REAL NOT NULL,

            escola_id INTEGER NOT NULL,

            UNIQUE(aluno_id, turma, escola_id)

        )

    `);

    // =====================================================

    // RELATÓRIOS

    // =====================================================

    db.run(`

        CREATE TABLE IF NOT EXISTS relatorios (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            aluno_id INTEGER NOT NULL,

            aluno_nome TEXT NOT NULL,

            turma TEXT NOT NULL,

            professor TEXT,

            conteudo TEXT NOT NULL,

            escola_id INTEGER,

            status TEXT DEFAULT 'Pendente',

            providencia TEXT,

            observacao_gestao TEXT,

            lido_gestao INTEGER DEFAULT 0,

            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP

        )

    `, (err) => {

        if (err) {

            console.error(

                'Erro criando tabelas:',

                err.message

            );

            process.exit(1);

        }

        prepararBanco();

    });

});

// =====================================================

// FUNÇÕES DE SEGURANÇA

// =====================================================

function exigirLogin(req, res, next) {

    if (!req.session.usuarioLogado) {

        return res.status(401).json({

            erro: 'Usuário não está logado.'

        });

    }

    next();

}

function exigirEscola(req, res, next) {

    if (!req.session.usuarioLogado) {

        return res.status(401).json({

            erro: 'Usuário não está logado.'

        });

    }

    if (!req.session.escolaSelecionada) {

        return res.status(403).json({

            erro: 'Nenhuma escola foi selecionada.'

        });

    }

    next();

}

function escolaAtual(req) {

    if (req.session.escolaSelecionada) {

        return req.session.escolaSelecionada.id;

    }

    return null;

}

// =====================================================

// LOGIN

// =====================================================

app.get('/', (req, res) => {

    res.sendFile(

        path.join(

            __dirname,

            'public',

            'index.html'

        )

    );

});

app.post('/login', (req, res) => {

    const { email, senha } = req.body;

    db.get(

        `

        SELECT *

        FROM usuarios

        WHERE email = ?

        AND senha = ?

        `,

        [email, senha],

        (err, usuario) => {

            if (err) {

                console.error(

                    'ERRO NO LOGIN:',

                    err.message

                );

                return res.status(500).send(

                    'Erro no servidor.'

                );

            }

            if (!usuario) {

                return res.send(`

                    <!DOCTYPE html>
                    
                    <html lang="pt-BR">
                    
                    <head>
                    
                        <meta charset="UTF-8">
                    
                        <meta
                    
                            name="viewport"
                    
                            content="width=device-width, initial-scale=1.0"
                    
                        >
                    
                        <title>EduClass | Erro no login</title>
                    
                        <link
                    
                            rel="preconnect"
                    
                            href="https://fonts.googleapis.com"
                    
                        >
                    
                        <link
                    
                            rel="preconnect"
                    
                            href="https://fonts.gstatic.com"
                    
                            crossorigin
                    
                        >
                    
                        <link
                    
                            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
                    
                            rel="stylesheet"
                    
                        >
                    
                        <style>
                    
                            * {
                    
                                box-sizing: border-box;
                    
                                margin: 0;
                    
                                padding: 0;
                    
                            }
                    
                            body {
                    
                                font-family: 'Inter', sans-serif;
                    
                                min-height: 100vh;
                    
                                display: flex;
                    
                                align-items: center;
                    
                                justify-content: center;
                    
                                background:
                    
                                    linear-gradient(
                    
                                        135deg,
                    
                                        #071a35,
                    
                                        #0b315f,
                    
                                        #159cff
                    
                                    );
                    
                                padding: 20px;
                    
                            }
                    
                            .container {
                    
                                width: 100%;
                    
                                max-width: 500px;
                    
                            }
                    
                            .logo {
                    
                                text-align: center;
                    
                                color: white;
                    
                                font-size: 30px;
                    
                                font-weight: 800;
                    
                                margin-bottom: 25px;
                    
                            }
                    
                            .logo span {
                    
                                color: #54c7ff;
                    
                            }
                    
                            .card {
                    
                                background: white;
                    
                                border-radius: 20px;
                    
                                padding: 40px;
                    
                                text-align: center;
                    
                                box-shadow:
                    
                                    0 20px 50px
                    
                                    rgba(0, 0, 0, 0.25);
                    
                            }
                    
                            .error-icon {
                    
                                width: 80px;
                    
                                height: 80px;
                    
                                margin: 0 auto 20px;
                    
                                border-radius: 50%;
                    
                                display: flex;
                    
                                align-items: center;
                    
                                justify-content: center;
                    
                                background: #fee2e2;
                    
                                color: #dc2626;
                    
                                font-size: 38px;
                    
                                font-weight: 700;
                    
                            }
                    
                            h1 {
                    
                                color: #071a35;
                    
                                font-size: 28px;
                    
                                margin-bottom: 12px;
                    
                            }
                    
                            .subtitle {
                    
                                color: #64748b;
                    
                                font-size: 15px;
                    
                                line-height: 1.6;
                    
                                margin-bottom: 25px;
                    
                            }
                    
                            .btn {
                    
                                display: block;
                    
                                width: 100%;
                    
                                padding: 14px 20px;
                    
                                border-radius: 10px;
                    
                                background: #159cff;
                    
                                color: white;
                    
                                text-decoration: none;
                    
                                font-size: 15px;
                    
                                font-weight: 700;
                    
                                transition: 0.2s;
                    
                            }
                    
                            .btn:hover {
                    
                                background: #087fd5;
                    
                                transform: translateY(-1px);
                    
                            }
                    
                            @media (max-width: 500px) {
                    
                                .card {
                    
                                    padding: 30px 22px;
                    
                                }
                    
                                h1 {
                    
                                    font-size: 24px;
                    
                                }
                    
                            }
                    
                        </style>
                    
                    </head>
                    
                    <body>
                    
                        <div class="container">
                    
                            <div class="logo">
                    
                                Edu<span>Class</span>
                    
                            </div>
                    
                            <div class="card">
                    
                                <div class="error-icon">
                    
                                    !
                    
                                </div>
                    
                                <h1>
                    
                                    Usuário ou senha incorretos
                    
                                </h1>
                    
                                <p class="subtitle">
                    
                                    Não foi possível entrar no EduClass.
                    
                                    Verifique seu usuário e sua senha e tente novamente.
                    
                                </p>
                    
                                <a href="/" class="btn">
                    
                                    Voltar para o login
                    
                                </a>
                    
                            </div>
                    
                        </div>
                    
                    </body>
                    
                    </html>
                    
                    `);

            }

            db.all(

                `

                SELECT

                    escolas.id,

                    escolas.nome,

                    escolas.codigo

                FROM usuario_escolas

                INNER JOIN escolas

                    ON escolas.id = usuario_escolas.escola_id

                WHERE usuario_escolas.usuario_id = ?

                ORDER BY escolas.nome ASC

                `,

                [usuario.id],

                (err, escolas) => {

                    if (err) {

                        console.error(

                            'ERRO AO CARREGAR ESCOLAS:',

                            err.message

                        );

                        return res.status(500).send(

                            'Erro ao carregar escolas.'

                        );

                    }

                    req.session.usuarioLogado = {

                        id: usuario.id,

                        nome: usuario.nome,

                        tipo: usuario.tipo,

                        escolas: escolas

                    };

                    req.session.escolaSelecionada = null;

                    if (escolas.length === 0) {

                        return res.send(`

                            <h2>

                                Você ainda não está vinculado a nenhuma escola.

                            </h2>

                            <a href="/">Voltar para o login</a>

                        `);

                    }

                    if (escolas.length === 1) {

                        req.session.escolaSelecionada =

                            escolas[0];

                        req.session.usuarioLogado.escola_id =

                            escolas[0].id;

                        if (usuario.tipo === 'gestor') {

                            return res.redirect('/gestor.html');

                        }

                        return res.redirect('/professor.html');

                    }

                    return res.redirect(

                        '/escolher-escola.html'

                    );

                }

            );

        }

    );

});

// =====================================================

// CADASTRAR PROFESSOR

// =====================================================

app.post(

    '/cadastrar-professor',

    exigirEscola,

    (req, res) => {

        if (

            req.session.usuarioLogado.tipo !== 'gestor'

        ) {

            return res.status(403).send(

                'Apenas a gestão pode cadastrar professores.'

            );

        }

        const {

            nome,

            email,

            senha

        } = req.body;

        if (!nome || !email || !senha) {

            return res.status(400).send(

                'Preencha todos os campos.'

            );

        }

        db.run(

            `

            INSERT INTO usuarios

            (

                nome,

                email,

                senha,

                tipo

            )

            VALUES (?, ?, ?, 'professor')

            `,

            [nome, email, senha],

            function(err) {

                if (err) {

                    return res.send(`

                        <h2>Erro: E-mail já cadastrado!</h2>

                        <a href="/gestor.html">Voltar</a>

                    `);

                }

                const usuarioId = this.lastID;

                db.run(

                    `

                    INSERT OR IGNORE INTO usuario_escolas

                    (

                        usuario_id,

                        escola_id

                    )

                    VALUES (?, ?)

                    `,

                    [

                        usuarioId,

                        escolaAtual(req)

                    ],

                    (linkErr) => {

                        if (linkErr) {

                            return res.status(500).send(

                                'Professor criado, mas não foi possível vinculá-lo à escola.'

                            );

                        }

                        res.redirect('/gestor.html');

                    }

                );

            }

        );

    }

);

// =====================================================

// VINCULAR ESCOLA

// =====================================================

app.post(

    '/vincular-escola',

    exigirLogin,

    (req, res) => {

        const {

            codigo_escola,

            usuario_id

        } = req.body;

        // =================================================

        // PROFESSOR ENTRA EM OUTRA ESCOLA

        // =================================================

        if (

            req.session.usuarioLogado.tipo === 'professor'

        ) {

            if (!codigo_escola) {

                return res.status(400).json({

                    erro: 'Digite o código da escola.'

                });

            }

            db.get(

                `

                SELECT id, nome, codigo

                FROM escolas

                WHERE codigo = ?

                `,

                [

                    codigo_escola

                        .trim()

                        .toUpperCase()

                ],

                (err, escola) => {

                    if (err) {

                        return res.status(500).json({

                            erro: err.message

                        });

                    }

                    if (!escola) {

                        return res.status(404).json({

                            erro: 'Código da escola inválido.'

                        });

                    }

                    const usuarioId =

                        req.session.usuarioLogado.id;

                    db.run(

                        `

                        INSERT OR IGNORE INTO usuario_escolas

                        (

                            usuario_id,

                            escola_id

                        )

                        VALUES (?, ?)

                        `,

                        [

                            usuarioId,

                            escola.id

                        ],

                        (err) => {

                            if (err) {

                                return res.status(500).json({

                                    erro: err.message

                                });

                            }

                            res.json({

                                mensagem:

                                    'Você entrou na escola com sucesso!',

                                escola: escola

                            });

                        }

                    );

                }

            );

            return;

        }

        // =================================================

        // GESTOR VINCULA PROFESSOR

        // =================================================

        if (

            req.session.usuarioLogado.tipo === 'gestor'

        ) {

            if (!req.session.escolaSelecionada) {

                return res.status(403).json({

                    erro:

                        'Selecione uma escola antes de vincular um professor.'

                });

            }

            if (!usuario_id || !codigo_escola) {

                return res.status(400).json({

                    erro:

                        'Usuário e código da escola são obrigatórios.'

                });

            }

            db.get(

                `

                SELECT id, nome, codigo

                FROM escolas

                WHERE codigo = ?

                `,

                [

                    codigo_escola

                        .trim()

                        .toUpperCase()

                ],

                (err, escola) => {

                    if (err) {

                        return res.status(500).json({

                            erro: err.message

                        });

                    }

                    if (!escola) {

                        return res.status(404).json({

                            erro:

                                'Código da escola inválido.'

                        });

                    }

                    db.get(

                        `

                        SELECT id, nome, tipo

                        FROM usuarios

                        WHERE id = ?

                        `,

                        [usuario_id],

                        (err, usuario) => {

                            if (err) {

                                return res.status(500).json({

                                    erro: err.message

                                });

                            }

                            if (!usuario) {

                                return res.status(404).json({

                                    erro:

                                        'Professor não encontrado.'

                                });

                            }

                            if (

                                usuario.tipo !== 'professor'

                            ) {

                                return res.status(400).json({

                                    erro:

                                        'Somente professores podem ser vinculados.'

                                });

                            }

                            db.run(

                                `

                                INSERT OR IGNORE INTO usuario_escolas

                                (

                                    usuario_id,

                                    escola_id

                                )

                                VALUES (?, ?)

                                `,

                                [

                                    usuario_id,

                                    escola.id

                                ],

                                (err) => {

                                    if (err) {

                                        return res.status(500).json({

                                            erro: err.message

                                        });

                                    }

                                    res.json({

                                        mensagem:

                                            'Professor vinculado à escola com sucesso!',

                                        escola: escola

                                    });

                                }

                            );

                        }

                    );

                }

            );

            return;

        }

        return res.status(403).json({

            erro: 'Usuário não autorizado.'

        });

    }

);

// =====================================================

// MINHAS ESCOLAS

// =====================================================

app.get(

    '/minhas-escolas',

    exigirLogin,

    (req, res) => {

        db.all(

            `

            SELECT

                escolas.id,

                escolas.nome,

                escolas.codigo

            FROM usuario_escolas

            INNER JOIN escolas

                ON escolas.id = usuario_escolas.escola_id

            WHERE usuario_escolas.usuario_id = ?

            ORDER BY escolas.nome ASC

            `,

            [

                req.session.usuarioLogado.id

            ],

            (err, escolas) => {

                if (err) {

                    return res.status(500).json({

                        erro:

                            'Erro ao carregar escolas.'

                    });

                }

                res.json(escolas);

            }

        );

    }

);

// =====================================================

// SELECIONAR ESCOLA

// =====================================================

app.post(

    '/selecionar-escola',

    exigirLogin,

    (req, res) => {

        const usuarioId =

            req.session.usuarioLogado.id;

        const escolaId =

            req.body.escola_id;

        if (!escolaId) {

            return res.status(400).json({

                erro: 'Escola não informada.'

            });

        }

        db.get(

            `

            SELECT

                escolas.id,

                escolas.nome,

                escolas.codigo

            FROM escolas

            INNER JOIN usuario_escolas

                ON usuario_escolas.escola_id = escolas.id

            WHERE escolas.id = ?

            AND usuario_escolas.usuario_id = ?

            `,

            [

                escolaId,

                usuarioId

            ],

            (err, escola) => {

                if (err) {

                    return res.status(500).json({

                        erro: err.message

                    });

                }

                if (!escola) {

                    return res.status(403).json({

                        erro:

                            'Você não possui acesso a esta escola.'

                    });

                }

                // =================================================

                // CORREÇÃO PRINCIPAL

                // =================================================

                req.session.escolaSelecionada = escola;

                req.session.usuarioLogado.escola_id =

                    escola.id;

                res.json({

                    mensagem:

                        'Escola selecionada com sucesso!',

                    escola: escola,

                    tipo:

                        req.session.usuarioLogado.tipo

                });

            }

        );

    }

);

// =====================================================

// ESCOLA ATUAL

// =====================================================

app.get(

    '/escola-atual',

    exigirLogin,

    (req, res) => {

        const escola =

            req.session.escolaSelecionada;

        if (!escola) {

            return res.json({

                escola_id: null,

                nome: null,

                codigo: null

            });

        }

        res.json({

            escola_id: escola.id,

            nome: escola.nome,

            codigo: escola.codigo

        });

    }

);

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

// RECADOS

// =====================================================

app.post(

    '/criar-recado',

    exigirEscola,

    (req, res) => {

        const {

            titulo,

            conteudo,

            autor

        } = req.body;

        if (!titulo || !conteudo) {

            return res.status(400).json({

                erro:

                    'Título e conteúdo são obrigatórios.'

            });

        }

        db.run(

            `

            INSERT INTO recados

            (

                titulo,

                conteudo,

                autor,

                escola_id

            )

            VALUES (?, ?, ?, ?)

            `,

            [

                titulo,

                conteudo,

                autor ||

                    req.session.usuarioLogado.nome,

                escolaAtual(req)

            ],

            (err) => {

                if (err) {

                    console.error(

                        'ERRO AO CRIAR RECADO:',

                        err.message

                    );

                    return res.status(500).json({

                        erro:

                            'Erro ao salvar recado.'

                    });

                }

                res.json({

                    mensagem:

                        'Recado salvo com sucesso!'

                });

            }

        );

    }

);

app.get(

    '/listar-recados',

    exigirEscola,

    (req, res) => {

        db.all(

            `

            SELECT *

            FROM recados

            WHERE escola_id = ?

            ORDER BY data_criacao DESC

            `,

            [

                escolaAtual(req)

            ],

            (err, rows) => {

                if (err) {

                    return res.status(500).json({

                        erro: err.message

                    });

                }

                res.json(rows);

            }

        );

    }

);

app.delete(

    '/apagar-recado/:id',

    exigirEscola,

    (req, res) => {

        db.run(

            `

            DELETE FROM recados

            WHERE id = ?

            AND escola_id = ?

            `,

            [

                req.params.id,

                escolaAtual(req)

            ],

            (err) => {

                if (err) {

                    return res.status(500).json({

                        erro: err.message

                    });

                }

                res.json({

                    mensagem:

                        'Recado apagado com sucesso!'

                });

            }

        );

    }

);

// =====================================================

// EVENTOS

// =====================================================

app.post(

    '/criar-evento',

    exigirEscola,

    (req, res) => {

        const {

            titulo,

            data_evento,

            descricao

        } = req.body;

        if (!titulo || !data_evento) {

            return res.status(400).json({

                erro:

                    'Título e data são obrigatórios.'

            });

        }

        db.run(

            `

            INSERT INTO eventos

            (

                titulo,

                data_evento,

                descricao,

                escola_id

            )

            VALUES (?, ?, ?, ?)

            `,

            [

                titulo,

                data_evento,

                descricao || '',

                escolaAtual(req)

            ],

            (err) => {

                if (err) {

                    return res.status(500).json({

                        erro:

                            'Erro ao salvar evento.'

                    });

                }

                res.json({

                    mensagem:

                        'Evento salvo com sucesso!'

                });

            }

        );

    }

);

app.get(

    '/listar-eventos',

    exigirEscola,

    (req, res) => {

        db.all(

            `

            SELECT *

            FROM eventos

            WHERE escola_id = ?

            ORDER BY data_evento ASC

            `,

            [

                escolaAtual(req)

            ],

            (err, rows) => {

                if (err) {

                    return res.status(500).json({

                        erro: err.message

                    });

                }

                res.json(rows);

            }

        );

    }

);

app.delete(

    '/apagar-evento/:id',

    exigirEscola,

    (req, res) => {

        db.run(

            `

            DELETE FROM eventos

            WHERE id = ?

            AND escola_id = ?

            `,

            [

                req.params.id,

                escolaAtual(req)

            ],

            (err) => {

                if (err) {

                    return res.status(500).json({

                        erro: err.message

                    });

                }

                res.json({

                    mensagem:

                        'Evento apagado com sucesso!'

                });

            }

        );

    }

);

// =====================================================

// PLANEJAMENTOS

// =====================================================

app.post(

    '/criar-planejamento',

    exigirEscola,

    (req, res) => {

        const {

            materia,

            conteudo,

            data_planejada

        } = req.body;

        db.run(

            `

            INSERT INTO planejamentos

            (

                materia,

                conteudo,

                data_planejada,

                escola_id

            )

            VALUES (?, ?, ?, ?)

            `,

            [

                materia,

                conteudo,

                data_planejada,

                escolaAtual(req)

            ],

            (err) => {

                if (err) {

                    return res.status(500).json({

                        erro:

                            'Erro ao salvar planejamento.'

                    });

                }

                res.json({

                    mensagem:

                        'Planejamento salvo com sucesso!'

                });

            }

        );

    }

);

app.get(

    '/listar-planejamentos',

    exigirEscola,

    (req, res) => {

        db.all(

            `

            SELECT *

            FROM planejamentos

            WHERE escola_id = ?

            ORDER BY data_planejada ASC

            `,

            [

                escolaAtual(req)

            ],

            (err, rows) => {

                if (err) {

                    return res.status(500).json({

                        erro: err.message

                    });

                }

                res.json(rows);

            }

        );

    }

);

app.delete(

    '/apagar-planejamento/:id',

    exigirEscola,

    (req, res) => {

        db.run(

            `

            DELETE FROM planejamentos

            WHERE id = ?

            AND escola_id = ?

            `,

            [

                req.params.id,

                escolaAtual(req)

            ],

            (err) => {

                if (err) {

                    return res.status(500).json({

                        erro: err.message

                    });

                }

                res.json({

                    mensagem:

                        'Planejamento apagado com sucesso!'

                });

            }

        );

    }

);

// =====================================================

// ALUNOS

// =====================================================

app.post(

    '/cadastrar-aluno',

    exigirEscola,

    (req, res) => {

        const {

            nome,

            turma

        } = req.body;

        if (!nome || !turma) {

            return res.status(400).json({

                erro:

                    'Nome e turma são obrigatórios.'

            });

        }

        db.run(

            `

            INSERT INTO alunos

            (

                nome,

                turma,

                escola_id

            )

            VALUES (?, ?, ?)

            `,

            [

                nome,

                turma,

                escolaAtual(req)

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

                    mensagem:

                        'Aluno cadastrado com sucesso!',

                    id: this.lastID

                });

            }

        );

    }

);

// =====================================================

// LISTAR ALUNOS

// =====================================================

app.get(

    '/listar-alunos',

    exigirEscola,

    (req, res) => {

        const turma = req.query.turma;

        if (turma) {

            db.all(

                `

                SELECT

                    id,

                    nome,

                    turma

                FROM alunos

                WHERE TRIM(turma) = TRIM(?)

                AND escola_id = ?

                ORDER BY nome ASC

                `,

                [

                    turma,

                    escolaAtual(req)

                ],

                (err, rows) => {

                    if (err) {

                        return res.status(500).json({

                            erro: err.message

                        });

                    }

                    res.json(rows);

                }

            );

        } else {

            db.all(

                `

                SELECT

                    id,

                    nome,

                    turma

                FROM alunos

                WHERE escola_id = ?

                ORDER BY turma ASC, nome ASC

                `,

                [

                    escolaAtual(req)

                ],

                (err, rows) => {

                    if (err) {

                        return res.status(500).json({

                            erro: err.message

                        });

                    }

                    res.json(rows);

                }

            );

        }

    }

);

// =====================================================

// SALVAR NOTAS

// =====================================================

app.post('/salvar-notas', exigirEscola, (req, res) => {

    const { turma, notas } = req.body;

    if (!turma || !Array.isArray(notas)) {

        return res.status(400).json({

            erro: 'Dados das notas inválidos.'

        });

    }

    const escolaId = escolaAtual(req);

    const stmt = db.prepare(`

        INSERT INTO notas (

            aluno_id,

            turma,

            nota,

            escola_id

        )

        VALUES (?, ?, ?, ?)

        ON CONFLICT(aluno_id, turma, escola_id)

        DO UPDATE SET nota = excluded.nota

    `);

    let erro = null;

    notas.forEach(item => {

        const nota = Number(item.nota);

        if (

            Number.isNaN(nota) ||

            nota < 0 ||

            nota > 10

        ) {

            erro = 'Uma das notas é inválida.';

            return;

        }

        stmt.run(

            item.aluno_id,

            turma,

            nota,

            escolaId

        );

    });

    stmt.finalize(err => {

        if (erro) {

            return res.status(400).json({

                erro

            });

        }

        if (err) {

            console.error(

                'Erro ao salvar notas:',

                err.message

            );

            return res.status(500).json({

                erro: err.message

            });

        }

        res.json({

            mensagem: 'Notas salvas com sucesso!'

        });

    });

});

// =====================================================

// LISTAR NOTAS

// =====================================================

app.get('/listar-notas', exigirEscola, (req, res) => {

    const turma = req.query.turma;

    if (!turma) {

        return res.status(400).json({

            erro: 'Turma não informada.'

        });

    }

    const escolaId = escolaAtual(req);

    db.all(`

        SELECT

            aluno_id,

            nota

        FROM notas

        WHERE TRIM(turma) = TRIM(?)

        AND escola_id = ?

    `, [turma, escolaId], (err, rows) => {

        if (err) {

            console.error(

                'Erro ao listar notas:',

                err.message

            );

            return res.status(500).json({

                erro: err.message

            });

        }

        res.json(rows);

    });

});

// =====================================================

// CHAMADA

// =====================================================

    app.post( '/registrar-chamada',

    exigirEscola,

    (req, res) => {

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

                erro:

                    'Turma e chamada são obrigatórios.'

            });

        }

        const stmt = db.prepare(`

            INSERT INTO frequencias

            (

                aluno_id,

                turma,

                status,

                escola_id

            )

            VALUES (?, ?, ?, ?)

        `);

        chamada.forEach(item => {

            stmt.run(

                item.aluno_id,

                turma,

                item.status,

                escolaAtual(req)

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

                mensagem:

                    'Chamada registrada com sucesso!'

            });

        });

    }

);

// =====================================================

// RELATÓRIOS

// =====================================================

app.post(

    '/criar-relatorio',

    exigirEscola,

    (req, res) => {

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

                erro:

                    'Preencha todos os campos obrigatórios.'

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

                conteudo,

                escola_id

            )

            VALUES (?, ?, ?, ?, ?, ?)

            `,

            [

                aluno_id,

                aluno_nome,

                turma,

                professor ||

                    req.session.usuarioLogado.nome,

                conteudo,

                escolaAtual(req)

            ],

            (err) => {

                if (err) {

                    console.error(

                        'ERRO AO CRIAR RELATÓRIO:',

                        err.message

                    );

                    return res.status(500).json({

                        erro:

                            'Erro ao criar relatório.'

                    });

                }

                res.json({

                    mensagem:

                        'Relatório enviado para a gestão com sucesso!'

                });

            }

        );

    }

);

app.get(

    '/listar-relatorios',

    exigirEscola,

    (req, res) => {

        db.all(

            `

            SELECT *

            FROM relatorios

            WHERE escola_id = ?

            ORDER BY id DESC

            `,

            [

                escolaAtual(req)

            ],

            (err, rows) => {

                if (err) {

                    console.error(

                        'ERRO AO LISTAR RELATÓRIOS:',

                        err.message

                    );

                    return res.status(500).json({

                        erro:

                            'Erro ao carregar relatórios.'

                    });

                }

                res.json(rows);

            }

        );

    }

);

// =====================================================

// AVALIAR RELATÓRIO

// =====================================================

app.post(

    '/avaliar-relatorio',

    exigirEscola,

    (req, res) => {

        const {

            id,

            status,

            providencia,

            observacao_gestao

        } = req.body;

        if (!id || !providencia) {

            return res.status(400).json({

                erro:

                    'Informe a providência da gestão.'

            });

        }

        db.run(

            `

            UPDATE relatorios

            SET

                status = ?,

                providencia = ?,

                observacao_gestao = ?,

                lido_gestao = 1

            WHERE id = ?

            AND escola_id = ?

            `,

            [

                status || 'Em acompanhamento',

                providencia,

                observacao_gestao || '',

                id,

                escolaAtual(req)

            ],

            (err) => {

                if (err) {

                    console.error(

                        'ERRO AO AVALIAR RELATÓRIO:',

                        err.message

                    );

                    return res.status(500).json({

                        erro:

                            'Erro ao registrar a avaliação.'

                    });

                }

                res.json({

                    mensagem:

                        'Providência da gestão registrada com sucesso!'

                });

            }

        );

    }

);

// =====================================================

// LISTAR PROFESSORES

// =====================================================

app.get(

    '/listar-professores',

    exigirEscola,

    (req, res) => {

        db.all(

            `

            SELECT

                usuarios.id,

                usuarios.nome,

                usuarios.email

            FROM usuarios

            INNER JOIN usuario_escolas

                ON usuario_escolas.usuario_id = usuarios.id

            WHERE usuarios.tipo = 'professor'

            AND usuario_escolas.escola_id = ?

            ORDER BY usuarios.nome ASC

            `,

            [

                escolaAtual(req)

            ],

            (err, professores) => {

                if (err) {

                    return res.status(500).json({

                        erro:

                            'Erro ao carregar professores.'

                    });

                }

                res.json(professores);

            }

        );

    }

);

// =====================================================

// CONTADORES DO GESTOR

// =====================================================

app.get(

    '/contadores-gestor',

    exigirEscola,

    (req, res) => {

        db.get(

            `

            SELECT COUNT(*) AS total

            FROM usuarios

            INNER JOIN usuario_escolas

                ON usuario_escolas.usuario_id = usuarios.id

            WHERE usuarios.tipo = 'professor'

            AND usuario_escolas.escola_id = ?

            `,

            [

                escolaAtual(req)

            ],

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

                    WHERE escola_id = ?

                    `,

                    [

                        escolaAtual(req)

                    ],

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

                            WHERE escola_id = ?

                            `,

                            [

                                escolaAtual(req)

                            ],

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

    }

);

// =====================================================

// APAGAR PROFESSOR

// =====================================================

app.delete(

    '/apagar-professor/:id',

    exigirEscola,

    (req, res) => {

        if (

            req.session.usuarioLogado.tipo !== 'gestor'

        ) {

            return res.status(403).json({

                erro:

                    'Apenas a gestão pode remover professores.'

            });

        }

        db.run(

            `

            DELETE FROM usuario_escolas

            WHERE usuario_id = ?

            AND escola_id = ?

            `,

            [

                req.params.id,

                escolaAtual(req)

            ],

            (err) => {

                if (err) {

                    return res.status(500).json({

                        erro: err.message

                    });

                }

                res.json({

                    mensagem:

                        'Professor removido desta escola com sucesso!'

                });

            }

        );

    }

);

// =====================================================

// ROTA ANTIGA

// =====================================================

app.get(

    '/criar-usuarios-teste',

    (req, res) => {

        res.send(`

            <h2>

                Esta rota de teste não é mais necessária.

            </h2>

            <a href="/">

                Voltar para o login

            </a>

        `);

    }

);

// =====================================================

// CADASTRO DE PROFESSOR

// =====================================================

app.post('/cadastro', (req, res) => {

    const {

        name,

        email,

        password,

        codigo_escola

    } = req.body;

    if (

        !name ||

        !email ||

        !password ||

        !codigo_escola

    ) {

        return res.status(400).send(`

            <h2>Preencha todos os campos.</h2>

            <a href="/">Voltar</a>

        `);

    }

    db.get(

        `

        SELECT id, nome, codigo

        FROM escolas

        WHERE codigo = ?

        `,

        [

            codigo_escola

                .trim()

                .toUpperCase()

        ],

        (err, escola) => {

            if (err) {

                console.error(

                    'ERRO AO VERIFICAR ESCOLA:',

                    err.message

                );

                return res.status(500).send(`

                    <h2>Erro ao verificar a escola.</h2>

                    <a href="/">Voltar</a>

                `);

            }

            if (!escola) {

                return res.status(400).send(`

                    <h2>Código da escola inválido.</h2>

                    <p>

                        Confira o código fornecido pela escola.

                    </p>

                    <a href="/">Voltar</a>

                `);

            }

            db.get(

                `

                SELECT id

                FROM usuarios

                WHERE email = ?

                `,

                [email],

                (err, usuarioExistente) => {

                    if (err) {

                        return res.status(500).send(`

                            <h2>

                                Erro ao verificar cadastro.

                            </h2>

                            <a href="/">

                                Voltar

                            </a>

                        `);

                    }

                    if (usuarioExistente) {

                        return res.status(400).send(`

                            <h2>

                                Este e-mail já está cadastrado.

                            </h2>

                            <a href="/">

                                Voltar

                            </a>

                        `);

                    }

                    db.run(

                        `

                        INSERT INTO usuarios

                        (

                            nome,

                            email,

                            senha,

                            tipo

                        )

                        VALUES (?, ?, ?, 'professor')

                        `,

                        [

                            name,

                            email,

                            password

                        ],

                        function(err) {

                            if (err) {

                                console.error(

                                    'ERRO AO CRIAR PROFESSOR:',

                                    err.message

                                );

                                return res.status(500).send(`

                                    <h2>

                                        Erro ao criar a conta.

                                    </h2>

                                    <a href="/">

                                        Voltar

                                    </a>

                                `);

                            }

                            const usuarioId =

                                this.lastID;

                            db.run(

                                `

                                INSERT INTO usuario_escolas

                                (

                                    usuario_id,

                                    escola_id

                                )

                                VALUES (?, ?)

                                `,

                                [

                                    usuarioId,

                                    escola.id

                                ],

                                (err) => {

                                    if (err) {

                                        console.error(

                                            'ERRO AO VINCULAR ESCOLA:',

                                            err.message

                                        );

                                        return res.status(500).send(`

                                            <h2>

                                                Conta criada, mas houve erro ao vincular a escola.

                                            </h2>

                                            <a href="/">

                                                Voltar

                                            </a>

                                        `);

                                    }

                                    res.send(`

                                        <!DOCTYPE html>
                                        
                                        <html lang="pt-BR">
                                        
                                        <head>
                                        
                                            <meta charset="UTF-8">
                                        
                                            <meta
                                        
                                                name="viewport"
                                        
                                                content="width=device-width, initial-scale=1.0"
                                        
                                            >
                                        
                                            <title>EduClass | Conta criada</title>
                                        
                                            <link
                                        
                                                rel="preconnect"
                                        
                                                href="https://fonts.googleapis.com"
                                        
                                            >
                                        
                                            <link
                                        
                                                rel="preconnect"
                                        
                                                href="https://fonts.gstatic.com"
                                        
                                                crossorigin
                                        
                                            >
                                        
                                            <link
                                        
                                                href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
                                        
                                                rel="stylesheet"
                                        
                                            >
                                        
                                            <style>
                                        
                                                * {
                                        
                                                    box-sizing: border-box;
                                        
                                                    margin: 0;
                                        
                                                    padding: 0;
                                        
                                                }
                                        
                                                body {
                                        
                                                    font-family: 'Inter', sans-serif;
                                        
                                                    min-height: 100vh;
                                        
                                                    display: flex;
                                        
                                                    align-items: center;
                                        
                                                    justify-content: center;
                                        
                                                    background:
                                        
                                                        linear-gradient(
                                        
                                                            135deg,
                                        
                                                            #071a35,
                                        
                                                            #0b315f,
                                        
                                                            #159cff
                                        
                                                        );
                                        
                                                    padding: 20px;
                                        
                                                }
                                        
                                                .container {
                                        
                                                    width: 100%;
                                        
                                                    max-width: 500px;
                                        
                                                }
                                        
                                                .logo {
                                        
                                                    text-align: center;
                                        
                                                    color: white;
                                        
                                                    font-size: 30px;
                                        
                                                    font-weight: 800;
                                        
                                                    margin-bottom: 25px;
                                        
                                                }
                                        
                                                .logo span {
                                        
                                                    color: #54c7ff;
                                        
                                                }
                                        
                                                .card {
                                        
                                                    background: white;
                                        
                                                    border-radius: 20px;
                                        
                                                    padding: 40px;
                                        
                                                    text-align: center;
                                        
                                                    box-shadow:
                                        
                                                        0 20px 50px
                                        
                                                        rgba(0, 0, 0, 0.25);
                                        
                                                }
                                        
                                                .success-icon {
                                        
                                                    width: 80px;
                                        
                                                    height: 80px;
                                        
                                                    margin: 0 auto 20px;
                                        
                                                    border-radius: 50%;
                                        
                                                    display: flex;
                                        
                                                    align-items: center;
                                        
                                                    justify-content: center;
                                        
                                                    background: #dcfce7;
                                        
                                                    color: #16a34a;
                                        
                                                    font-size: 38px;
                                        
                                                    font-weight: 700;
                                        
                                                }
                                        
                                                h1 {
                                        
                                                    color: #071a35;
                                        
                                                    font-size: 28px;
                                        
                                                    margin-bottom: 12px;
                                        
                                                }
                                        
                                                .subtitle {
                                        
                                                    color: #64748b;
                                        
                                                    font-size: 15px;
                                        
                                                    line-height: 1.6;
                                        
                                                    margin-bottom: 25px;
                                        
                                                }
                                        
                                                .school-box {
                                        
                                                    background: #f1f7fc;
                                        
                                                    border: 1px solid #dbeafe;
                                        
                                                    border-radius: 12px;
                                        
                                                    padding: 18px;
                                        
                                                    margin-bottom: 25px;
                                        
                                                }
                                        
                                                .school-label {
                                        
                                                    display: block;
                                        
                                                    color: #64748b;
                                        
                                                    font-size: 13px;
                                        
                                                    margin-bottom: 6px;
                                        
                                                }
                                        
                                                .school-name {
                                        
                                                    color: #071a35;
                                        
                                                    font-size: 18px;
                                        
                                                    font-weight: 700;
                                        
                                                }
                                        
                                                .info {
                                        
                                                    color: #475569;
                                        
                                                    font-size: 14px;
                                        
                                                    line-height: 1.6;
                                        
                                                    margin-bottom: 25px;
                                        
                                                }
                                        
                                                .btn {
                                        
                                                    display: block;
                                        
                                                    width: 100%;
                                        
                                                    padding: 14px 20px;
                                        
                                                    border-radius: 10px;
                                        
                                                    background: #159cff;
                                        
                                                    color: white;
                                        
                                                    text-decoration: none;
                                        
                                                    font-size: 15px;
                                        
                                                    font-weight: 700;
                                        
                                                    transition: 0.2s;
                                        
                                                }
                                        
                                                .btn:hover {
                                        
                                                    background: #087fd5;
                                        
                                                    transform: translateY(-1px);
                                        
                                                }
                                        
                                                .check {
                                        
                                                    color: #16a34a;
                                        
                                                    margin-right: 6px;
                                        
                                                }
                                        
                                                @media (max-width: 500px) {
                                        
                                                    .card {
                                        
                                                        padding: 30px 22px;
                                        
                                                    }
                                        
                                                    h1 {
                                        
                                                        font-size: 24px;
                                        
                                                    }
                                        
                                                }
                                        
                                            </style>
                                        
                                        </head>
                                        
                                        <body>
                                        
                                            <div class="container">
                                        
                                                <div class="logo">
                                        
                                                    Edu<span>Class</span>
                                        
                                                </div>
                                        
                                                <div class="card">
                                        
                                                    <div class="success-icon">
                                        
                                                        ✓
                                        
                                                    </div>
                                        
                                                    <h1>
                                        
                                                        Conta criada com sucesso!
                                        
                                                    </h1>
                                        
                                                    <p class="subtitle">
                                        
                                                        Sua conta foi criada e já está pronta para ser utilizada.
                                        
                                                    </p>
                                        
                                                    <div class="school-box">
                                        
                                                        <span class="school-label">
                                        
                                                            Escola vinculada
                                        
                                                        </span>
                                        
                                                        <div class="school-name">
                                        
                                                            ${escola.nome}
                                        
                                                        </div>
                                        
                                                    </div>
                                        
                                                    <p class="info">
                                        
                                                        <span class="check">✓</span>
                                        
                                                        Agora você pode entrar no EduClass e acessar o painel do professor.
                                        
                                                    </p>
                                        
                                                    <a href="/" class="btn">
                                        
                                                        Entrar no EduClass
                                        
                                                    </a>
                                        
                                                </div>
                                        
                                            </div>
                                        
                                        </body>
                                        
                                        </html>
                                        
                                        `);
                                }

                            );

                        }

                    );

                }

            );

        }

    );

});