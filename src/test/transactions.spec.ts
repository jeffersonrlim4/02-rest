import request from 'supertest'
import { app } from '../app'
import { expect, it, beforeAll, afterAll, describe, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'

describe('Transactions Routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new transaction', async () => {
    const response = await request(app.server).post('/transactions').send({
      title: 'New Transaction',
      amount: 5000,
      type: 'credit',
    })

    expect(response.statusCode).toEqual(201)
  })

  it('should be able to list all transactions', async () => {
    const createNewTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Get a Cookie',
        amount: 2000,
        type: 'credit',
      })

    const cookies = createNewTransactionResponse.get('Set-Cookie')

    const responseListTransactions = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)

    expect(responseListTransactions.statusCode).toEqual(200)

    expect(responseListTransactions.body).toEqual({
      transactions: [
        expect.objectContaining({
          title: 'Get a Cookie',
          amount: 2000,
        }),
      ],
    })
  })

  it('should be able to get a specific transaction', async () => {
    const createNewTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Get a Cookie',
        amount: 2000,
        type: 'credit',
      })

    const cookies = createNewTransactionResponse.get('Set-Cookie')

    const responseListTransactions = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)

    const transactionId = responseListTransactions.body.transactions[0].id

    const responseDetailTransaction = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)

    expect(responseDetailTransaction.statusCode).toEqual(200)

    expect(responseDetailTransaction.body.transaction).toEqual(
      expect.objectContaining({
        title: 'Get a Cookie',
        amount: 2000,
      }),
    )
  })

  it('should be able to get the summary', async () => {
    const createNewTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createNewTransactionResponse.get('Set-Cookie')

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'New Transaction',
        amount: 2000,
        type: 'debit',
      })

    const responseSummaryTransactions = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)

    expect(responseSummaryTransactions.body.summary).toEqual({
      amount: 3000,
    })
  })
})
