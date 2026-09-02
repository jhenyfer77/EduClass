let alunos = [];

const turmaSelect = document.getElementById("turma");

const alunoSelect = document.getElementById("aluno");

const conteudo = document.getElementById("conteudo");

const btnEnviar = document.getElementById("btnEnviarRelatorio");

// =====================================================

// CARREGAR ALUNOS

// =====================================================

function carregarAlunos() {

    fetch("/listar-alunos")

        .then(response => {

            if (!response.ok) {

                throw new Error("Erro ao carregar alunos.");

            }

            return response.json();

        })

        .then(dados => {

            alunos = dados || [];

            carregarTurmas();

        })

        .catch(error => {

            console.error(error);

            turmaSelect.innerHTML = `

                <option value="">

                    Erro ao carregar turmas

                </option>

            `;

        });

}

// =====================================================

// CARREGAR TURMAS

// =====================================================

function carregarTurmas() {

    const turmas = [

        ...new Set(

            alunos

                .map(aluno => aluno.turma)

                .filter(turma => turma)

        )

    ];

    turmaSelect.innerHTML = `

        <option value="">

            Selecione a turma

        </option>

    `;

    turmas.forEach(turma => {

        const option = document.createElement("option");

        option.value = turma;

        option.textContent = turma;

        turmaSelect.appendChild(option);

    });

}

// =====================================================

// QUANDO ESCOLHER A TURMA

// =====================================================

turmaSelect.addEventListener("change", function() {

    const turmaSelecionada = turmaSelect.value;

    alunoSelect.innerHTML = `

        <option value="">

            Selecione o aluno

        </option>

    `;

    if (!turmaSelecionada) {

        alunoSelect.disabled = true;

        alunoSelect.innerHTML = `

            <option value="">

                Primeiro selecione uma turma

            </option>

        `;

        return;

    }

    const alunosDaTurma = alunos.filter(

        aluno => aluno.turma === turmaSelecionada

    );

    alunosDaTurma.forEach(aluno => {

        const option = document.createElement("option");

        option.value = aluno.id;

        option.textContent = aluno.nome;

        alunoSelect.appendChild(option);

    });

    alunoSelect.disabled = false;

});

// =====================================================

// ENVIAR RELATÓRIO

// =====================================================

btnEnviar.addEventListener("click", function() {

    const alunoId = alunoSelect.value;

    const texto = conteudo.value.trim();

    if (!turmaSelect.value) {

        alert("Selecione uma turma.");

        return;

    }

    if (!alunoId) {

        alert("Selecione um aluno.");

        return;

    }

    if (!texto) {

        alert("Digite o relatório.");

        return;

    }

    const aluno = alunos.find(

        aluno => String(aluno.id) === String(alunoId)

    );

    if (!aluno) {

        alert("Aluno não encontrado.");

        return;

    }

    fetch("/criar-relatorio", {

        method: "POST",

        headers: {

            "Content-Type": "application/json"

        },

        body: JSON.stringify({

            aluno_id: aluno.id,

            aluno_nome: aluno.nome,

            turma: aluno.turma,

            professor: "",

            conteudo: texto

        })

    })

    .then(response => {

        if (!response.ok) {

            throw new Error("Erro ao enviar relatório.");

        }

        return response.json();

    })

    .then(resultado => {

        alert(resultado.mensagem);

        turmaSelect.value = "";

        alunoSelect.innerHTML = `

            <option value="">

                Primeiro selecione uma turma

            </option>

        `;

        alunoSelect.disabled = true;

        conteudo.value = "";

    })

    .catch(error => {

        console.error(error);

        alert("Não foi possível enviar o relatório.");

    });

});

// =====================================================

// INICIAR

// =====================================================

carregarAlunos();