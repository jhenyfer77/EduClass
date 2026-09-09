let alunos = [];

const turmaSelect = document.getElementById("turma");
const listaChamada = document.getElementById("listaChamada");
const btnRegistrar = document.getElementById("btnRegistrar");


// =====================================================
// CARREGAR TURMAS E ALUNOS DO BANCO
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

            console.log("ALUNOS RECEBIDOS DO SERVIDOR:", dados);

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
// COLOCAR AS TURMAS NO SELECT
// =====================================================

function carregarTurmas() {

    turmaSelect.innerHTML = `
        <option value="">
            Selecione a turma
        </option>
    `;

    const turmas = [
        ...new Set(
            alunos
                .map(aluno => aluno.turma)
                .filter(turma => turma)
        )
    ];

    turmas.sort();

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

turmaSelect.addEventListener("change", function () {

    const turmaSelecionada = this.value;

    if (!turmaSelecionada) {

        listaChamada.innerHTML = `
            <p>
                Selecione uma turma para carregar os alunos.
            </p>
        `;

        return;
    }


    // =================================================
    // BUSCA OS ALUNOS DA TURMA NO SERVIDOR
    // =================================================

    fetch(
        "/listar-alunos?turma=" +
        encodeURIComponent(turmaSelecionada)
    )

        .then(response => {

            if (!response.ok) {
                throw new Error("Erro ao buscar alunos da turma.");
            }

            return response.json();

        })

        .then(alunosDaTurma => {

            console.log(
                "TURMA SELECIONADA:",
                turmaSelecionada
            );

            console.log(
                "ALUNOS ENCONTRADOS:",
                alunosDaTurma
            );


            // =============================================
            // NENHUM ALUNO
            // =============================================

            if (
                !Array.isArray(alunosDaTurma) ||
                alunosDaTurma.length === 0
            ) {

                listaChamada.innerHTML = `
                    <p>
                        Nenhum aluno encontrado nessa turma.
                    </p>
                `;

                return;
            }


            // =============================================
            // MOSTRAR TODOS OS ALUNOS
            // =============================================

            listaChamada.innerHTML = alunosDaTurma.map(aluno => {

                return `
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
                `;

            }).join("");

        })

        .catch(error => {

            console.error(
                "ERRO AO CARREGAR ALUNOS:",
                error
            );

            listaChamada.innerHTML = `
                <p>
                    Erro ao carregar os alunos.
                </p>
            `;

        });

});


// =====================================================
// REGISTRAR CHAMADA
// =====================================================

btnRegistrar.addEventListener("click", function () {

    const turma = turmaSelect.value;


    if (!turma) {

        alert("Selecione uma turma.");

        return;

    }


    // Pega os alunos que já foram carregados
    // para a turma selecionada

    fetch(
        "/listar-alunos?turma=" +
        encodeURIComponent(turma)
    )

        .then(response => {

            if (!response.ok) {
                throw new Error("Erro ao buscar alunos.");
            }

            return response.json();

        })

        .then(alunosDaTurma => {

            if (
                !Array.isArray(alunosDaTurma) ||
                alunosDaTurma.length === 0
            ) {

                alert(
                    "Nenhum aluno encontrado nessa turma."
                );

                return;

            }


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


            return fetch("/registrar-chamada", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    turma: turma,

                    chamada: chamada

                })

            });

        })

        .then(response => {

            if (!response) {
                return;
            }

            if (!response.ok) {

                throw new Error(
                    "Erro ao registrar chamada."
                );

            }

            return response.json();

        })

        .then(resultado => {

            if (resultado) {

                alert(resultado.mensagem);

            }

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