

        /* =========================================

           NAVEGAÇÃO

        ========================================= */

        function mostrarPagina(pagina) {

            document

                .querySelectorAll('.page-section')

                .forEach(secao => {

                    secao.style.display = 'none';

                });

            const paginaSelecionada =

                document.getElementById(pagina);

            if (paginaSelecionada) {

                paginaSelecionada.style.display = 'block';

            }

            document

                .querySelectorAll('.menu-item[data-page]')

                .forEach(menu => {

                    menu.classList.remove('active');

                    if (menu.dataset.page === pagina) {

                        menu.classList.add('active');

                    }

                });

            atualizarTitulo(pagina);

        }

        function irParaPagina(pagina) {

            mostrarPagina(pagina);

        }

        function atualizarTitulo(pagina) {

            const titulo =

                document.getElementById('pageTitle');

            const titulos = {

                inicio: 'Dashboard',

                professores: 'Professores',

                relatorios: 'Relatórios',

                alunos: 'Alunos',

                recados: 'Recados',

                calendario: 'Calendário',

                configuracoes: 'Configurações'

            };

            if (titulo) {

                titulo.textContent =

                    titulos[pagina] || 'Dashboard';

            }

        }

        /* =========================================

           MENU

        ========================================= */

        document

            .querySelectorAll('.menu-item[data-page]')

            .forEach(menu => {

                menu.addEventListener('click', function(event) {

                    event.preventDefault();

                    mostrarPagina(

                        this.dataset.page

                    );

                });

            });

        /* =========================================

           ACESSO RÁPIDO

        ========================================= */

        document

            .querySelectorAll('[data-go-page]')

            .forEach(botao => {

                botao.addEventListener(

                    'click',

                    function(event) {

                        event.preventDefault();

                        mostrarPagina(

                            this.dataset.goPage

                        );

                    }

                );

            });

        /* =========================================

           MENU MOBILE

        ========================================= */

        const menuToggle =

            document.getElementById('menuToggle');

        const sidebar =

            document.getElementById('sidebar');

        const sidebarOverlay =

            document.getElementById('sidebarOverlay');

        if (menuToggle) {

            menuToggle.addEventListener(

                'click',

                function() {

                    sidebar.classList.toggle('open');

                    if (sidebarOverlay) {

                        sidebarOverlay.classList.toggle(

                            'active'

                        );

                    }

                }

            );

        }

        if (sidebarOverlay) {

            sidebarOverlay.addEventListener(

                'click',

                function() {

                    sidebar.classList.remove('open');

                    sidebarOverlay.classList.remove(

                        'active'

                    );

                }

            );

        }

        /* =========================================

           DATA

        ========================================= */

        function mostrarDataAtual() {

            const elemento =

                document.getElementById('currentDate');

            if (!elemento) {

                return;

            }

            const agora = new Date();

            elemento.textContent =

                agora.toLocaleDateString(

                    'pt-BR',

                    {

                        weekday: 'long',

                        day: 'numeric',

                        month: 'long',

                        year: 'numeric'

                    }

                );

        }

        /* =========================================

           PROFESSORES

        ========================================= */

        function carregarListaProfessores() {

            fetch('/listar-professores')

                .then(res => res.json())

                .then(professores => {

                    const lista =

                        document.getElementById(

                            'listaProfessores'

                        );

                    if (!lista) {

                        return;

                    }

                    if (

                        !Array.isArray(professores) ||

                        professores.length === 0

                    ) {

                        lista.innerHTML =

                            '<li>Nenhum professor cadastrado ainda.</li>';

                        return;

                    }

                    lista.innerHTML =

                        professores.map(p => `

                            <li class="data-list-item">

                                <div>

                                    <strong>

                                        ${p.nome}

                                    </strong>

                                    <span>

                                        ${p.email}

                                    </span>

                                </div>

                                <button

                                    type="button"

                                    onclick="apagarProfessor(${p.id})"

                                    class="btn btn-danger"

                                >

                                    Excluir

                                </button>

                            </li>

                        `).join('');

                })

                .catch(error => {

                    console.error(

                        'Erro ao carregar professores:',

                        error

                    );

                    const lista =

                        document.getElementById(

                            'listaProfessores'

                        );

                    if (lista) {

                        lista.innerHTML =

                            '<li>Erro ao carregar professores.</li>';

                    }

                });

        }

        function apagarProfessor(id) {

            if (!confirm(

                'Tem certeza que deseja remover este professor do sistema?'

            )) {

                return;

            }

            fetch(

                `/apagar-professor/${id}`,

                {

                    method: 'DELETE'

                }

            )

            .then(res => res.json())

            .then(() => {

                carregarListaProfessores();

                atualizarContadores();

            })

            .catch(error => {

                console.error(

                    'Erro ao apagar professor:',

                    error

                );

            });

        }

        /* =========================================

           CONTADORES

        ========================================= */

        function atualizarContadores() {

            fetch('/contadores-gestor')

                .then(res => res.json())

                .then(dados => {

                    const professores =

                        document.getElementById(

                            'qtdProfessores'

                        );

                    const recados =

                        document.getElementById(

                            'qtdRecados'

                        );

                    const eventos =

                        document.getElementById(

                            'qtdEventos'

                        );

                    if (professores) {

                        professores.innerText =

                            dados.professores || 0;

                    }

                    if (recados) {

                        recados.innerText =

                            dados.recados || 0;

                    }

                    if (eventos) {

                        eventos.innerText =

                            dados.eventos || 0;

                    }

                })

                .catch(error => {

                    console.error(

                        'Erro nos contadores:',

                        error

                    );

                });

        }

        /* =========================================

           ALUNOS

        ========================================= */

        async function atualizarQuantidadeAlunos() {

            const elemento =

                document.getElementById('qtdAlunos');

            if (!elemento) {

                return;

            }

            try {

                const response =

                    await fetch('/listar-alunos');

                const alunos =

                    await response.json();

                elemento.innerText =

                    Array.isArray(alunos)

                        ? alunos.length

                        : 0;

            } catch (error) {

                console.error(

                    'Erro ao carregar alunos:',

                    error

                );

                elemento.innerText = '0';

            }

        }

        async function cadastrarAluno(event) {

            event.preventDefault();

            const form =

                document.getElementById('formAluno');

            if (!form) {

                return;

            }

            const dados =

                new URLSearchParams(

                    new FormData(form)

                );

            try {

                const response =

                    await fetch(

                        '/cadastrar-aluno',

                        {

                            method: 'POST',

                            body: dados

                        }

                    );

                const resultado =

                    await response.json();

                if (!response.ok) {

                    throw new Error(

                        resultado.erro ||

                        'Erro ao cadastrar aluno.'

                    );

                }

                alert(

                    'Aluno cadastrado com sucesso!'

                );

                form.reset();

                atualizarQuantidadeAlunos();

            } catch (error) {

                alert(error.message);

            }

        }

        /* =========================================

           RECADOS

        ========================================= */

        function carregarRecados() {

            fetch('/listar-recados')

                .then(res => res.json())

                .then(recados => {

                    const mural =

                        document.getElementById('mural');

                    if (!mural) {

                        return;

                    }

                    if (

                        !Array.isArray(recados) ||

                        recados.length === 0

                    ) {

                        mural.innerHTML =

                            '<p>Nenhum recado postado até o momento.</p>';

                        return;

                    }

                    mural.innerHTML =

                        recados.map(r => `

                            <div class="communication-item">

                                <div class="communication-icon">

                                    <i class="fa-solid fa-bullhorn"></i>

                                </div>

                                <div class="communication-content">

                                    <div class="communication-title">

                                        ${r.titulo}

                                    </div>

                                    <div class="communication-text">

                                        ${r.conteudo}

                                    </div>

                                    <div class="communication-date">

                                        Por:

                                        <strong>${r.autor}</strong>

                                    </div>

                                    <button

                                        type="button"

                                        onclick="apagarItem('/apagar-recado/${r.id}', 'recado')"

                                        class="btn btn-danger"

                                    >

                                        Apagar recado

                                    </button>

                                </div>

                            </div>

                        `).join('');

                })

                .catch(error => {

                    console.error(

                        'Erro ao carregar recados:',

                        error

                    );

                });

        }

        /* =========================================

           EVENTOS

        ========================================= */

        function carregarEventos() {

            fetch('/listar-eventos')

                .then(res => res.json())

                .then(eventos => {

                    const lista =

                        document.getElementById(

                            'listaEventos'

                        );

                    if (!lista) {

                        return;

                    }

                    if (

                        !Array.isArray(eventos) ||

                        eventos.length === 0

                    ) {

                        lista.innerHTML =

                            '<p>Nenhum evento agendado.</p>';

                        return;

                    }

                    lista.innerHTML =

                        eventos.map(e => `

                            <div class="communication-item">

                                <div class="communication-icon">

                                    <i class="fa-solid fa-calendar-days"></i>

                                </div>

                                <div class="communication-content">

                                    <div class="communication-title">

                                        ${e.titulo}

                                    </div>

                                    <div class="communication-text">

                                        Data: ${e.data_evento}

                                    </div>

                                    <div class="communication-date">

                                        ${e.descricao || ''}

                                    </div>

                                    <button

                                        type="button"

                                        onclick="apagarItem('/apagar-evento/${e.id}', 'evento')"

                                        class="btn btn-danger"

                                    >

                                        Apagar evento

                                    </button>

                                </div>

                            </div>

                        `).join('');

                })

                .catch(error => {

                    console.error(

                        'Erro ao carregar eventos:',

                        error

                    );

                });

        }

        /* =========================================

           APAGAR

        ========================================= */

        function apagarItem(url, tipo) {

            if (!confirm(

                `Tem certeza que deseja apagar este ${tipo}?`

            )) {

                return;

            }

            fetch(

                url,

                {

                    method: 'DELETE'

                }

            )

            .then(res => res.json())

            .then(() => {

                carregarRecados();

                carregarEventos();

                atualizarContadores();

            })

            .catch(error => {

                console.error(

                    'Erro ao apagar:',

                    error

                );

            });

        }

        /* =========================================

           FORMULÁRIO DE RECADO

        ========================================= */

        const formRecado =

            document.getElementById('formRecado');

        if (formRecado) {

            formRecado.addEventListener(

                'submit',

                function(event) {

                    event.preventDefault();

                    const dados =

                        new URLSearchParams(

                            new FormData(formRecado)

                        );

                    fetch(

                        '/criar-recado',

                        {

                            method: 'POST',

                            body: dados

                        }

                    )

                    .then(res => res.json())

                    .then(resultado => {

                        if (resultado.erro) {

                            alert(

                                resultado.erro

                            );

                            return;

                        }

                        alert(

                            'Recado publicado com sucesso!'

                        );

                        formRecado.reset();

                        carregarRecados();

                        atualizarContadores();

                    })

                    .catch(error => {

                        console.error(

                            error

                        );

                        alert(

                            'Erro ao publicar o recado.'

                        );

                    });

                }

            );

        }

        /* =========================================

           FORMULÁRIO DE EVENTO

        ========================================= */

        const formEvento =

            document.getElementById('formEvento');

        if (formEvento) {

            formEvento.addEventListener(

                'submit',

                function(event) {

                    event.preventDefault();

                    const dados =

                        new URLSearchParams(

                            new FormData(formEvento)

                        );

                    fetch(

                        '/criar-evento',

                        {

                            method: 'POST',

                            body: dados

                        }

                    )

                    .then(res => res.json())

                    .then(resultado => {

                        if (resultado.erro) {

                            alert(

                                resultado.erro

                            );

                            return;

                        }

                        alert(

                            'Evento salvo com sucesso!'

                        );

                        formEvento.reset();

                        carregarEventos();

                        atualizarContadores();

                    })

                    .catch(error => {

                        console.error(

                            error

                        );

                        alert(

                            'Erro ao salvar o evento.'

                        );

                    });

                }

            );

        }

        /* =========================================

           RELATÓRIOS

        ========================================= */

        function carregarRelatorios() {

            const lista =

                document.getElementById(

                    'listaRelatorios'

                );

            if (!lista) {

                return;

            }

            fetch('/listar-relatorios')

                .then(res => {

                    if (!res.ok) {

                        throw new Error(

                            'Erro ao buscar relatórios.'

                        );

                    }

                    return res.json();

                })

                .then(relatorios => {

                    if (

                        !Array.isArray(relatorios) ||

                        relatorios.length === 0

                    ) {

                        lista.innerHTML = `

                            <p>

                                Nenhum relatório foi enviado pelos professores.

                            </p>

                        `;

                        return;

                    }

                    lista.innerHTML =

                        relatorios.map(r => `

                            <div class="report-card">

                                <h3>

                                    ${r.aluno_nome}

                                </h3>

                                <p>

                                    <strong>Turma:</strong>

                                    ${r.turma}

                                </p>

                                <p>

                                    <strong>Professor:</strong>

                                    ${r.professor || 'Não informado'}

                                </p>

                                <p>

                                    <strong>Relatório:</strong>

                                    ${r.conteudo}

                                </p>

                                <p>

                                    <strong>Status atual:</strong>

                                    ${r.status || 'Pendente'}

                                </p>

                                <hr>

                                <h4>

                                    Providência da gestão

                                </h4>

                                <label>

                                    Status

                                </label>

                                <select id="status_${r.id}">

                                    <option

                                        value="Pendente"

                                        ${r.status === 'Pendente' ? 'selected' : ''}

                                    >

                                        Pendente

                                    </option>

                                    <option

                                        value="Em acompanhamento"

                                        ${r.status === 'Em acompanhamento' ? 'selected' : ''}

                                    >

                                        Em acompanhamento

                                    </option>

                                    <option

                                        value="Resolvido"

                                        ${r.status === 'Resolvido' ? 'selected' : ''}

                                    >

                                        Resolvido

                                    </option>

                                </select>

                                <label>

                                    Providência

                                </label>

                                <textarea

                                    id="providencia_${r.id}"

                                    placeholder="Informe o que a gestão decidiu fazer..."

                                >${r.providencia || ''}</textarea>

                                <label>

                                    Observação da gestão

                                </label>

                                <textarea

                                    id="observacao_${r.id}"

                                    placeholder="Adicione uma observação..."

                                >${r.observacao_gestao || ''}</textarea>

                                <button

                                    type="button"

                                    onclick="avaliarRelatorio(${r.id})"

                                >

                                    Registrar providência

                                </button>

                            </div>

                        `).join('');

                })

                .catch(error => {

                    console.error(

                        'Erro ao carregar relatórios:',

                        error

                    );

                    lista.innerHTML = `

                        <p>

                            Erro ao carregar os relatórios.

                        </p>

                    `;

                });

        }

        function avaliarRelatorio(id) {

            const statusElemento =

                document.getElementById(

                    `status_${id}`

                );

            const providenciaElemento =

                document.getElementById(

                    `providencia_${id}`

                );

            const observacaoElemento =

                document.getElementById(

                    `observacao_${id}`

                );

            if (

                !statusElemento ||

                !providenciaElemento ||

                !observacaoElemento

            ) {

                return;

            }

            const status =

                statusElemento.value;

            const providencia =

                providenciaElemento.value;

            const observacao =

                observacaoElemento.value;

            if (!providencia.trim()) {

                alert(

                    'Informe a providência da gestão.'

                );

                return;

            }

            fetch(

                '/avaliar-relatorio',

                {

                    method: 'POST',

                    headers: {

                        'Content-Type':

                            'application/json'

                    },

                    body: JSON.stringify({

                        id: id,

                        status: status,

                        providencia: providencia,

                        observacao_gestao:

                            observacao

                    })

                }

            )

            .then(res => res.json())

            .then(resultado => {

                if (resultado.erro) {

                    alert(

                        resultado.erro

                    );

                    return;

                }

                alert(

                    'Providência registrada com sucesso!'

                );

                carregarRelatorios();

            })

            .catch(error => {

                console.error(

                    'Erro ao avaliar relatório:',

                    error

                );

                alert(

                    'Erro ao registrar a providência.'

                );

            });

        }

        /* =========================================

           INICIALIZAÇÃO

        ========================================= */

        document.addEventListener(

            'DOMContentLoaded',

            function() {

                mostrarDataAtual();

                atualizarContadores();

                atualizarQuantidadeAlunos();

                carregarListaProfessores();

                carregarRecados();

                carregarEventos();

                carregarRelatorios();

            }

        );

    