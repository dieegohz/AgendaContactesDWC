// ============================================
// VARIABLES GLOBALS I INICIALITZACIÓ
// ============================================

// Clau per a LocalStorage
const STORAGE_KEY = 'contactesLlibreta';
let contactes = [];
let contacteAEliminar = null;
let isEditMode = false;

// ============================================
// FUNCIONS PRINCIPALS
// ============================================

/**
 * Carrega les dades inicials del fitxer JSON i les guarda a LocalStorage
 */
async function carregarDadesInicials() {
    try {
        // Intentar carregar des del fitxer JSON
        const resposta = await fetch('contacts.json');
        const dadesInicials = await resposta.json();
        
        // Comprovar si ja hi ha dades a LocalStorage
        const dadesGuardades = localStorage.getItem(STORAGE_KEY);
        
        if (!dadesGuardades) {
            // Guardar les dades inicials a LocalStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dadesInicials));
            contactes = dadesInicials;
        } else {
            // Carregar les dades existents de LocalStorage
            contactes = JSON.parse(dadesGuardades);
        }
        
        console.log('Dades carregades correctament');
        return contactes;
    } catch (error) {
        console.error('Error carregant les dades:', error);
        
        // Intentar carregar de LocalStorage com a fallback
        const dadesGuardades = localStorage.getItem(STORAGE_KEY);
        if (dadesGuardades) {
            contactes = JSON.parse(dadesGuardades);
            return contactes;
        } else {
            // Si no hi ha res, tornar array buit
            contactes = [];
            return contactes;
        }
    }
}

/**
 * Guarda els contactes a LocalStorage
 */
function guardarContactes() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contactes));
    console.log('Contactes guardats a LocalStorage');
}

/**
 * Carrega i mostra la llista de contactes a la pàgina principal
 */
async function carregarLlistaContactes() {
    // Comprovar si estem a la pàgina principal
    if (!document.getElementById('contactsTableBody')) return;
    
    // Carregar les dades
    await carregarDadesInicials();
    
    const tbody = document.getElementById('contactsTableBody');
    const contactCount = document.getElementById('contactCount');
    const noContactsMessage = document.getElementById('noContactsMessage');
    
    // Netejar la taula
    tbody.innerHTML = '';
    
    // Actualitzar el comptador
    contactCount.textContent = contactes.length;
    
    // Mostrar o amagar el missatge "no hi ha contactes"
    if (contactes.length === 0) {
        noContactsMessage.style.display = 'block';
        return;
    } else {
        noContactsMessage.style.display = 'none';
    }
    
    // Afegir cada contacte a la taula
    contactes.forEach(contacte => {
        const fila = document.createElement('tr');
        
        fila.innerHTML = `
            <td>${contacte.nom}</td>
            <td>${contacte.email}</td>
            <td>${contacte.telefon}</td>
            <td class="actions">
                <a href="detall.html?id=${contacte.id}" class="btn btn-primary btn-small">
                    <i class="fas fa-eye"></i> Veure
                </a>
                <a href="detall.html?id=${contacte.id}&edit=true" class="btn btn-secondary btn-small">
                    <i class="fas fa-edit"></i> Editar
                </a>
                <button class="btn btn-danger btn-small btn-delete" data-id="${contacte.id}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </td>
        `;
        
        tbody.appendChild(fila);
    });
    
    // Afegir esdeveniments als botons d'eliminar
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            mostrarModalEliminar(id);
        });
    });
}

/**
 * Carrega i mostra el detall d'un contacte
 */
async function carregarDetallContacte() {
    // Comprovar si estem a la pàgina de detall
    if (!document.getElementById('contactInfo')) return;
    
    // Carregar les dades
    await carregarDadesInicials();
    
    // Obtenir l'ID del contacte de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const id = parseInt(urlParams.get('id'));
    
    if (!id) {
        document.getElementById('contactInfo').innerHTML = `
            <div class="error-message">
                <h3>Error</h3>
                <p>No s'ha especificat cap contacte.</p>
                <a href="index.html" class="btn btn-primary">Tornar a la llista</a>
            </div>
        `;
        return;
    }
    
    // Buscar el contacte
    const contacte = contactes.find(c => c.id === id);
    
    if (!contacte) {
        document.getElementById('contactInfo').innerHTML = `
            <div class="error-message">
                <h3>Contacte no trobat</h3>
                <p>El contacte sol·licitat no existeix.</p>
                <a href="index.html" class="btn btn-primary">Tornar a la llista</a>
            </div>
        `;
        return;
    }
    
    // Actualitzar el títol de la pàgina
    document.getElementById('detailTitle').innerHTML = `<i class="fas fa-user"></i> Detall de ${contacte.nom}`;
    
    // Mostrar les dades del contacte
    document.getElementById('contactInfo').innerHTML = `
        <h3>${contacte.nom}</h3>
        <p><i class="fas fa-envelope"></i> <strong>Email:</strong> ${contacte.email}</p>
        <p><i class="fas fa-phone"></i> <strong>Telèfon:</strong> ${contacte.telefon}</p>
        <p><i class="fas fa-id-card"></i> <strong>ID:</strong> ${contacte.id}</p>
    `;
    
    // Configurar el botó d'eliminar
    document.getElementById('deleteButton').addEventListener('click', () => {
        mostrarModalEliminar(id);
    });
    
    // Configurar el formulari d'edició
    configurarEdicioContacte(contacte);
    
    // Comprovar si hem d'obrir directament el mode d'edició
    const editMode = urlParams.get('edit');
    if (editMode === 'true') {
        isEditMode = true;
        document.getElementById('editButton').click();
    }
}

/**
 * Configura el formulari d'edició d'un contacte
 */
function configurarEdicioContacte(contacte) {
    const editButton = document.getElementById('editButton');
    const editFormContainer = document.getElementById('editFormContainer');
    const editContactForm = document.getElementById('editContactForm');
    const cancelEdit = document.getElementById('cancelEdit');
    
    // Configurar els valors del formulari
    document.getElementById('editName').value = contacte.nom;
    document.getElementById('editEmail').value = contacte.email;
    document.getElementById('editPhone').value = contacte.telefon;
    
    // Mostrar/amagar el formulari d'edició
    editButton.addEventListener('click', () => {
        isEditMode = true;
        editFormContainer.style.display = 'block';
        editButton.style.display = 'none';
    });
    
    cancelEdit.addEventListener('click', () => {
        isEditMode = false;
        editFormContainer.style.display = 'none';
        editButton.style.display = 'inline-flex';
    });
    
    // Gestió de l'enviament del formulari
    editContactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Actualitzar el contacte
        const index = contactes.findIndex(c => c.id === contacte.id);
        if (index !== -1) {
            contactes[index] = {
                ...contactes[index],
                nom: document.getElementById('editName').value,
                email: document.getElementById('editEmail').value,
                telefon: document.getElementById('editPhone').value
            };
            
            // Guardar canvis
            guardarContactes();
            
            // Actualitzar la visualització
            carregarDetallContacte();
            
            // Amagar el formulari d'edició
            editFormContainer.style.display = 'none';
            editButton.style.display = 'inline-flex';
            isEditMode = false;
            
            // Mostrar missatge de confirmació
            alert('Contacte actualitzat correctament!');
        }
    });
}

/**
 * Configura el formulari per afegir un nou contacte
 */
function configurarFormulariAfegir() {
    // Comprovar si estem a la pàgina d'afegir
    const addContactForm = document.getElementById('addContactForm');
    if (!addContactForm) return;
    
    // Carregar les dades per obtenir l'últim ID
    carregarDadesInicials();
    
    // Actualitzar la vista prèvia en temps real
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    
    const previewName = document.getElementById('previewName');
    const previewEmail = document.getElementById('previewEmail');
    const previewPhone = document.getElementById('previewPhone');
    
    function actualitzarPreview() {
        previewName.textContent = nameInput.value || 'Nom del contacte';
        previewEmail.textContent = emailInput.value || 'email@exemple.com';
        previewPhone.textContent = phoneInput.value || '123456789';
    }
    
    nameInput.addEventListener('input', actualitzarPreview);
    emailInput.addEventListener('input', actualitzarPreview);
    phoneInput.addEventListener('input', actualitzarPreview);
    
    // Inicialitzar la vista prèvia
    actualitzarPreview();
    
    // Gestió de l'enviament del formulari
    addContactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Validar les dades
        const nom = nameInput.value.trim();
        const email = emailInput.value.trim();
        const telefon = phoneInput.value.trim();
        const esPreferit = document.getElementById('favorite').checked;
        
        if (nom.length < 2) {
            alert('El nom ha de tenir com a mínim 2 caràcters');
            nameInput.focus();
            return;
        }
        
        if (!email.includes('@') || !email.includes('.')) {
            alert('Si us plau, introdueix una adreça de correu vàlida');
            emailInput.focus();
            return;
        }
        
        if (!/^\d+$/.test(telefon)) {
            alert('El telèfon només pot contenir números');
            phoneInput.focus();
            return;
        }
        
        // Generar un nou ID (màxim existent + 1)
        const nouId = contactes.length > 0 
            ? Math.max(...contactes.map(c => c.id)) + 1 
            : 1;
        
        // Crear el nou contacte
        const nouContacte = {
            id: nouId,
            nom,
            email,
            telefon,
            preferit: esPreferit
        };
        
        // Afegir el contacte a l'array
        contactes.push(nouContacte);
        
        // Guardar a LocalStorage
        guardarContactes();
        
        // Mostrar el modal de confirmació
        const successModal = document.getElementById('successModal');
        const successMessage = document.getElementById('successMessage');
        const goToList = document.getElementById('goToList');
        const addAnother = document.getElementById('addAnother');
        
        successMessage.textContent = `${nom} s'ha afegit correctament a la teva llibreta de contactes.`;
        successModal.style.display = 'flex';
        
        // Configurar els botons del modal
        goToList.addEventListener('click', () => {
            successModal.style.display = 'none';
            window.location.href = 'index.html';
        });
        
        addAnother.addEventListener('click', () => {
            successModal.style.display = 'none';
            addContactForm.reset();
            actualitzarPreview();
            nameInput.focus();
        });
        
        // Netejar el formulari
        addContactForm.reset();
        actualitzarPreview();
    });
}

/**
 * Configura la funcionalitat de cerca
 */
function configurarCerca() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const clearSearch = document.getElementById('clearSearch');
    
    if (!searchInput || !searchButton) return;
    
    function executarCerca() {
        const terme = searchInput.value.toLowerCase().trim();
        
        if (terme === '') {
            carregarLlistaContactes();
            return;
        }
        
        const contactesFiltrats = contactes.filter(contacte => 
            contacte.nom.toLowerCase().includes(terme) ||
            contacte.email.toLowerCase().includes(terme) ||
            contacte.telefon.includes(terme)
        );
        
        // Actualitzar la taula amb els resultats filtrats
        const tbody = document.getElementById('contactsTableBody');
        const contactCount = document.getElementById('contactCount');
        const noContactsMessage = document.getElementById('noContactsMessage');
        
        tbody.innerHTML = '';
        contactCount.textContent = contactesFiltrats.length;
        
        if (contactesFiltrats.length === 0) {
            noContactsMessage.style.display = 'block';
            noContactsMessage.innerHTML = `
                <i class="fas fa-search"></i>
                <p>No s'han trobat contactes que coincideixin amb "${terme}"</p>
                <button id="clearSearchInline" class="btn btn-primary">Netejar cerca</button>
            `;
            
            document.getElementById('clearSearchInline').addEventListener('click', () => {
                searchInput.value = '';
                carregarLlistaContactes();
            });
        } else {
            noContactsMessage.style.display = 'none';
            
            contactesFiltrats.forEach(contacte => {
                const fila = document.createElement('tr');
                
                fila.innerHTML = `
                    <td>${contacte.nom}</td>
                    <td>${contacte.email}</td>
                    <td>${contacte.telefon}</td>
                    <td class="actions">
                        <a href="detall.html?id=${contacte.id}" class="btn btn-primary btn-small">
                            <i class="fas fa-eye"></i> Veure
                        </a>
                        <a href="detall.html?id=${contacte.id}&edit=true" class="btn btn-secondary btn-small">
                            <i class="fas fa-edit"></i> Editar
                        </a>
                        <button class="btn btn-danger btn-small btn-delete" data-id="${contacte.id}">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </td>
                `;
                
                tbody.appendChild(fila);
            });
            
            // Afegir esdeveniments als botons d'eliminar
            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    mostrarModalEliminar(id);
                });
            });
        }
    }
    
    searchButton.addEventListener('click', executarCerca);
    
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            executarCerca();
        }
    });
    
    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        carregarLlistaContactes();
    });
}

/**
 * Mostra el modal per confirmar l'eliminació d'un contacte
 */
function mostrarModalEliminar(id) {
    contacteAEliminar = id;
    const modal = document.getElementById('deleteModal');
    modal.style.display = 'flex';
    
    // Configurar els botons del modal
    document.getElementById('cancelDelete').addEventListener('click', () => {
        modal.style.display = 'none';
        contacteAEliminar = null;
    });
    
    document.getElementById('confirmDelete').addEventListener('click', eliminarContacte);
}

/**
 * Elimina el contacte seleccionat
 */
function eliminarContacte() {
    if (contacteAEliminar === null) return;
    
    const index = contactes.findIndex(c => c.id === contacteAEliminar);
    
    if (index !== -1) {
        // Eliminar el contacte
        const nomContacte = contactes[index].nom;
        contactes.splice(index, 1);
        
        // Guardar canvis
        guardarContactes();
        
        // Amagar el modal
        document.getElementById('deleteModal').style.display = 'none';
        
        // Mostrar missatge de confirmació
        alert(`${nomContacte} s'ha eliminat correctament.`);
        
        // Actualitzar la vista
        if (window.location.pathname.includes('detall.html')) {
            // Si estem a la pàgina de detall, redirigir a l'inici
            window.location.href = 'index.html';
        } else {
            // Si estem a l'inici, actualitzar la llista
            carregarLlistaContactes();
        }
    }
    
    contacteAEliminar = null;
}

// ============================================
// INICIALITZACIÓ DE L'APLICACIÓ
// ============================================

/**
 * Funció principal que s'executa quan la pàgina es carrega
 */
async function init() {
    console.log('Inicialitzant aplicació...');
    
    // Carregar dades inicials
    await carregarDadesInicials();
    
    // Configurar funcionalitats segons la pàgina actual
    if (document.getElementById('contactsTableBody')) {
        // Pàgina principal
        await carregarLlistaContactes();
        configurarCerca();
    } else if (document.getElementById('contactInfo')) {
        // Pàgina de detall
        await carregarDetallContacte();
    } else if (document.getElementById('addContactForm')) {
        // Pàgina d'afegir
        configurarFormulariAfegir();
    }
    
    // Configurar el modal d'eliminar (comú a totes les pàgines)
    const modal = document.getElementById('deleteModal');
    if (modal) {
        // Tancar el modal en fer clic fora
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                contacteAEliminar = null;
            }
        });
    }
    
    console.log('Aplicació inicialitzada correctament');
}

// Executar la inicialització quan el DOM estigui carregat
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}