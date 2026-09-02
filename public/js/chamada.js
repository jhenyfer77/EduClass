let alunos = [];

const turmaSelect = document.getElementById("turma");

const listaChamada = document.getElementById("listaChamada");

const btnRegistrar = document.getElementById("btnRegistrar");

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

            listaChamada.innerHTML = `

                <p>

                    Não foi possível carregar os alunos.

                </p>

            `;

        });

}

// =====================================================

// CARREGAR TURMAS NO SELECT

// =====================================================

function carregarTurmas() {

    const turmas = [

        ...new Set(

            alunos.map(aluno => aluno.turma)

        )

    ];

    turmaSelect.innerHTML = `

        <option value="">

            Selecione a turma

        </option>

    `;

    turmas.forEach(turma => {

        const option =

            document.createElement("option");

        option.value = turma;

        option.textContent = turma;

        turmaSelect.appendChild(option);

    });

}

// =====================================================

// QUANDO SELECIONAR A TURMA

// =====================================================

turmaSelect.addEventListener("change", function() {

    const turmaSelecionada = this.value;

    if (!turmaSelecionada) {

        listaChamada.innerHTML = `

            <p>

                Selecione uma turma para carregar os alunos.

            </p>

        `;

        return;

    }

    const alunosDaTurma =

        alunos.filter(

            aluno => aluno.turma === turmaSelecionada

        );

    if (alunosDaTurma.length === 0) {

        listaChamada.innerHTML = `

            <p>

                Nenhum aluno encontrado nessa turma.

            </p>

        `;

        return;

    }

    listaChamada.innerHTML =

        alunosDaTurma.map(aluno => `

            <div class="chamada-aluno">

                <strong>

                    ${aluno.nome}

                </strong>

                <div>

                    <label>

                        <input

                            type="radio"

                            name="presenca-${aluno.id}"

                            value="presente"

                            checked

                        >

                        Presente

                    </label>

                    <label>

                        <input

                            type="radio"

                            name="presenca-${aluno.id}"

                            value="falta"

                        >

                        Falta

                    </label>

                </div>

            </div>

        `).join("");

});

// =====================================================

// REGISTRAR CHAMADA

// =====================================================

btnRegistrar.addEventListener("click", function() {

    const turma = turmaSelect.value;

    if (!turma) {

        alert("Selecione uma turma.");

        return;

    }

    const alunosDaTurma =

        alunos.filter(

            aluno => aluno.turma === turma

        );

    const chamada = alunosDaTurma.map(aluno => {

        const selecionado =

            document.querySelector(

                `input[name="presenca-${aluno.id}"]:checked`

            );

        return {

            aluno_id: aluno.id,

            status: selecionado

                ? selecionado.value

                : "falta"

        };

    });

    fetch("/registrar-chamada", {

        method: "POST",

        headers: {

            "Content-Type": "application/json"

        },

        body: JSON.stringify({

            turma: turma,

            chamada: chamada

        })

    })

    .then(response => {

        if (!response.ok) {

            throw new Error("Erro ao registrar chamada.");

        }

        return response.json();

    })

    .then(resultado => {

        alert(resultado.mensagem);

    })

    .catch(error => {

        console.error(error);

        alert(

            "Não foi possível registrar a chamada."

        );

    });

});

// =====================================================

// INICIAR

// =====================================================

carregarAlunos();