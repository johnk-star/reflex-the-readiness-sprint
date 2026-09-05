const API_URL = 'http://localhost:3000/api';


const RIDER_ID = 3;


/*
|--------------------------------------------------------------------------
| DOM elements
|--------------------------------------------------------------------------
*/

const deliveriesContainer =
    document.getElementById('deliveries-container');

const messageElement =
    document.getElementById('message');

const refreshButton =
    document.getElementById('refresh-btn');

const riderNameElement =
    document.getElementById('rider-name');

const assignedCount =
    document.getElementById('assigned-count');

const pickedUpCount =
    document.getElementById('picked-up-count');

const deliveredCount =
    document.getElementById('delivered-count');

const confirmationModal =
    document.getElementById('confirmation-modal');

const confirmationForm =
    document.getElementById('confirmation-form');

const confirmationDeliveryId =
    document.getElementById('confirmation-delivery-id');

const confirmationCode =
    document.getElementById('confirmation-code');

const closeModalButton =
    document.getElementById('close-modal');


/*
|--------------------------------------------------------------------------
| State
|--------------------------------------------------------------------------
*/

let riderDeliveries = [];


/*
|--------------------------------------------------------------------------
| Utility functions
|--------------------------------------------------------------------------
*/

function showMessage(text, type = 'info') {

    messageElement.textContent = text;

    messageElement.className = `message ${type}`;

}


function hideMessage() {

    messageElement.textContent = '';

    messageElement.className = 'message hidden';

}


function setLoading() {

    deliveriesContainer.innerHTML = `
        <div class="loading">
            Loading deliveries...
        </div>
    `;

}


function escapeHtml(value) {

    if (value === null || value === undefined) {
        return '';
    }

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


/*
|--------------------------------------------------------------------------
| Load deliveries
|--------------------------------------------------------------------------
|
| We request ASSIGNED, PICKED_UP and DELIVERED deliveries.
|
| The backend returns rider_id, so we filter the results to make sure
| the rider only sees deliveries assigned to them.
|
*/

async function loadDeliveries() {

    try {

        hideMessage();

        setLoading();

        /*
         * Fetch assigned deliveries
         */
        const assignedResponse = await fetch(
            `${API_URL}/deliveries?status=ASSIGNED`
        );

        if (!assignedResponse.ok) {

            throw new Error(
                'Unable to load assigned deliveries.'
            );

        }

        const assignedDeliveries =
            await assignedResponse.json();


        /*
         * Fetch picked-up deliveries
         */
        const pickedUpResponse = await fetch(
            `${API_URL}/deliveries?status=PICKED_UP`
        );

        if (!pickedUpResponse.ok) {

            throw new Error(
                'Unable to load picked-up deliveries.'
            );

        }

        const pickedUpDeliveries =
            await pickedUpResponse.json();


        /*
         * Fetch delivered deliveries
         *
         * This allows the rider to see recently completed deliveries.
         */
        const deliveredResponse = await fetch(
            `${API_URL}/deliveries?status=DELIVERED`
        );

        if (!deliveredResponse.ok) {

            throw new Error(
                'Unable to load delivered deliveries.'
            );

        }

        const deliveredDeliveries =
            await deliveredResponse.json();


        /*
         * Combine all deliveries
         */
        const allDeliveries = [
            ...assignedDeliveries,
            ...pickedUpDeliveries,
            ...deliveredDeliveries
        ];


        /*
         * Only keep deliveries assigned to this rider.
         */
        riderDeliveries = allDeliveries.filter(
            delivery =>
                Number(delivery.rider_id) === Number(RIDER_ID)
        );


        /*
         * Remove duplicates.
         */
        const uniqueDeliveries = [];

        const deliveryIds = new Set();

        riderDeliveries.forEach(delivery => {

            if (!deliveryIds.has(delivery.delivery_id)) {

                deliveryIds.add(delivery.delivery_id);

                uniqueDeliveries.push(delivery);

            }

        });

        riderDeliveries = uniqueDeliveries;


        /*
         * Sort newest first.
         */
        riderDeliveries.sort(
            (a, b) =>
                new Date(b.created_at) -
                new Date(a.created_at)
        );


        /*
         * Render deliveries.
         */
        renderDeliveries();


        /*
         * Update statistics.
         */
        updateStatistics();


        /*
         * Set rider name from API response.
         */
        if (riderDeliveries.length > 0) {

            riderNameElement.textContent =
                riderDeliveries[0].rider_name || 'Rider';

        }


    } catch (error) {

        console.error(
            'Error loading deliveries:',
            error
        );

        deliveriesContainer.innerHTML = `
            <div class="empty-state">
                <h3>Unable to load deliveries</h3>
                <p>
                    Please check that the API server is running
                    and try again.
                </p>
            </div>
        `;

        showMessage(
            error.message,
            'error'
        );

    }

}


/*
|--------------------------------------------------------------------------
| Render deliveries
|--------------------------------------------------------------------------
*/

function renderDeliveries() {

    deliveriesContainer.innerHTML = '';


    if (riderDeliveries.length === 0) {

        deliveriesContainer.innerHTML = `
            <div class="empty-state">

                <h3>No deliveries yet</h3>

                <p>
                    You currently have no deliveries assigned to you.
                </p>

            </div>
        `;

        return;

    }


    riderDeliveries.forEach(delivery => {

        const card =
            createDeliveryCard(delivery);

        deliveriesContainer.appendChild(card);

    });

}


/*
|--------------------------------------------------------------------------
| Create delivery card
|--------------------------------------------------------------------------
*/

function createDeliveryCard(delivery) {

    const card =
        document.createElement('article');

    card.className =
        'delivery-card';


    const status =
        delivery.status || 'UNKNOWN';


    const statusClass =
        status.toLowerCase().replace('_', '-');


    let actionButtons = '';


    /*
     * ASSIGNED
     */
    if (status === 'ASSIGNED') {

        actionButtons = `
            <button
                class="primary-btn"
                onclick="pickUpDelivery(${delivery.delivery_id})"
            >
                Pick Up Delivery
            </button>
        `;

    }


    /*
     * PICKED_UP
     */
    else if (status === 'PICKED_UP') {

        actionButtons = `
            <button
                class="primary-btn"
                onclick="openConfirmationModal(
                    ${delivery.delivery_id}
                )"
            >
                Confirm Delivery
            </button>

            <button
                class="secondary-btn"
                onclick="markDelivered(
                    ${delivery.delivery_id}
                )"
            >
                Mark as Delivered
            </button>
        `;

    }


    /*
     * DELIVERED
     */
    else if (status === 'DELIVERED') {

        actionButtons = `
            <span class="completed-label">
                Delivery Completed
            </span>
        `;

    }


    card.innerHTML = `

        <div class="delivery-card-header">

            <div>

                <span class="delivery-label">
                    DELIVERY
                </span>

                <h3>
                    #${escapeHtml(delivery.delivery_id)}
                </h3>

            </div>

            <span class="status-badge ${statusClass}">
                ${escapeHtml(status.replace('_', ' '))}
            </span>

        </div>


        <div class="delivery-details">

            <div class="detail">

                <span class="detail-label">
                    Customer
                </span>

                <strong>
                    ${escapeHtml(delivery.customer_name)}
                </strong>

            </div>


            <div class="detail">

                <span class="detail-label">
                    Phone
                </span>

                <strong>
                    ${escapeHtml(delivery.customer_phone)}
                </strong>

            </div>


            <div class="detail full-width">

                <span class="detail-label">
                    Delivery Address
                </span>

                <strong>
                    ${escapeHtml(delivery.delivery_address)}
                </strong>

            </div>


            <div class="detail">

                <span class="detail-label">
                    Item
                </span>

                <strong>
                    ${escapeHtml(delivery.item_description)}
                </strong>

            </div>


            <div class="detail">

                <span class="detail-label">
                    Quantity
                </span>

                <strong>
                    ${escapeHtml(delivery.quantity || 1)}
                </strong>

            </div>


            ${
                delivery.product_name
                    ? `
                    <div class="detail">

                        <span class="detail-label">
                            Product
                        </span>

                        <strong>
                            ${escapeHtml(
                                delivery.product_name
                            )}
                        </strong>

                    </div>
                    `
                    : ''
            }

        </div>


        <div class="delivery-actions">

            ${actionButtons}

        </div>

    `;


    return card;

}


/*
|--------------------------------------------------------------------------
| Update statistics
|--------------------------------------------------------------------------
*/

function updateStatistics() {

    const assigned =
        riderDeliveries.filter(
            delivery =>
                delivery.status === 'ASSIGNED'
        ).length;


    const pickedUp =
        riderDeliveries.filter(
            delivery =>
                delivery.status === 'PICKED_UP'
        ).length;


    const delivered =
        riderDeliveries.filter(
            delivery =>
                delivery.status === 'DELIVERED'
        ).length;


    assignedCount.textContent =
        assigned;

    pickedUpCount.textContent =
        pickedUp;

    deliveredCount.textContent =
        delivered;

}


/*
|--------------------------------------------------------------------------
| Pick up delivery
|--------------------------------------------------------------------------
|
| POST
| /api/deliveries/:deliveryId/status
|
| Body:
| {
|     status: "PICKED_UP",
|     updated_by: RIDER_ID
| }
|
*/

async function pickUpDelivery(deliveryId) {

    const confirmed =
        confirm(
            'Are you sure you want to pick up this delivery?'
        );


    if (!confirmed) {
        return;
    }


    try {

        showMessage(
            'Updating delivery...',
            'info'
        );


        const response =
            await fetch(
                `${API_URL}/deliveries/${deliveryId}/status`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({
                        status: 'PICKED_UP',

                        updated_by: RIDER_ID
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                'Unable to pick up delivery.'
            );

        }


        showMessage(
            'Delivery picked up successfully.',
            'success'
        );


        await loadDeliveries();

    } catch (error) {

        console.error(
            'Pick-up error:',
            error
        );

        showMessage(
            error.message,
            'error'
        );

    }

}


/*
|--------------------------------------------------------------------------
| Mark delivery as delivered
|--------------------------------------------------------------------------
|
| POST
| /api/deliveries/:deliveryId/status
|
| Body:
| {
|     status: "DELIVERED",
|     updated_by: RIDER_ID
| }
|
*/

async function markDelivered(deliveryId) {

    const confirmed =
        confirm(
            'Are you sure this delivery has been completed?'
        );


    if (!confirmed) {
        return;
    }


    try {

        showMessage(
            'Marking delivery as delivered...',
            'info'
        );


        const response =
            await fetch(
                `${API_URL}/deliveries/${deliveryId}/status`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({
                        status: 'DELIVERED',

                        updated_by: RIDER_ID
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                'Unable to mark delivery as delivered.'
            );

        }


        showMessage(
            'Delivery marked as delivered.',
            'success'
        );


        await loadDeliveries();

    } catch (error) {

        console.error(
            'Delivery completion error:',
            error
        );

        showMessage(
            error.message,
            'error'
        );

    }

}


/*
|--------------------------------------------------------------------------
| Open confirmation modal
|--------------------------------------------------------------------------
*/

function openConfirmationModal(deliveryId) {

    confirmationDeliveryId.value =
        deliveryId;

    confirmationCode.value =
        '';

    confirmationModal.classList.remove(
        'hidden'
    );

    confirmationCode.focus();

}


/*
|--------------------------------------------------------------------------
| Close confirmation modal
|--------------------------------------------------------------------------
*/

function closeConfirmationModal() {

    confirmationModal.classList.add(
        'hidden'
    );

}


/*
|--------------------------------------------------------------------------
| Submit confirmation
|--------------------------------------------------------------------------
|
| POST
| /api/deliveries/:deliveryId/confirm
|
| Body:
| {
|     confirmation_code: "...",
|     scanned_by: RIDER_ID,
|     result: "SUCCESSFUL"
| }
|
*/

async function submitConfirmation(event) {

    event.preventDefault();


    const deliveryId =
        confirmationDeliveryId.value;


    const code =
        confirmationCode.value.trim();


    const result =
        document.querySelector(
            'input[name="confirmation-result"]:checked'
        ).value;


    if (!code) {

        showMessage(
            'Please enter the confirmation code.',
            'error'
        );

        return;

    }


    try {

        const submitButton =
            confirmationForm.querySelector(
                'button[type="submit"]'
            );


        submitButton.disabled = true;

        submitButton.textContent =
            'Submitting...';


        const response =
            await fetch(
                `${API_URL}/deliveries/${deliveryId}/confirm`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({

                        confirmation_code:
                            code,

                        scanned_by:
                            RIDER_ID,

                        result:
                            result

                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                'Unable to submit confirmation.'
            );

        }


        closeConfirmationModal();


        /*
         * If confirmation succeeded, mark the delivery
         * as delivered.
         */
        if (result === 'SUCCESSFUL') {

            const deliveryResponse =
                await fetch(
                    `${API_URL}/deliveries/${deliveryId}/status`,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({

                            status:
                                'DELIVERED',

                            updated_by:
                                RIDER_ID

                        })
                    }
                );


            const deliveryData =
                await deliveryResponse.json();


            if (!deliveryResponse.ok) {

                throw new Error(
                    deliveryData.error ||
                    'Confirmation succeeded but delivery status could not be updated.'
                );

            }


            showMessage(
                'Delivery confirmed and marked as delivered.',
                'success'
            );

        } else {

            showMessage(
                'Delivery confirmation recorded as failed.',
                'error'
            );

        }


        await loadDeliveries();


    } catch (error) {

        console.error(
            'Confirmation error:',
            error
        );

        showMessage(
            error.message,
            'error'
        );

    } finally {

        const submitButton =
            confirmationForm.querySelector(
                'button[type="submit"]'
            );


        submitButton.disabled = false;

        submitButton.textContent =
            'Submit Confirmation';

    }

}


/*
|--------------------------------------------------------------------------
| Event listeners
|--------------------------------------------------------------------------
*/

refreshButton.addEventListener(
    'click',
    loadDeliveries
);


closeModalButton.addEventListener(
    'click',
    closeConfirmationModal
);


confirmationForm.addEventListener(
    'submit',
    submitConfirmation
);


/*
 * Close modal when clicking outside it.
 */
confirmationModal.addEventListener(
    'click',
    event => {

        if (
            event.target ===
            confirmationModal
        ) {

            closeConfirmationModal();

        }

    }
);


/*
 * Escape key closes modal.
 */
document.addEventListener(
    'keydown',
    event => {

        if (event.key === 'Escape') {

            closeConfirmationModal();

        }

    }
);


/*
|--------------------------------------------------------------------------
| Initial load
|--------------------------------------------------------------------------
*/

loadDeliveries();