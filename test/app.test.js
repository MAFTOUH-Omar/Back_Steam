const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');
const expect = chai.expect;

chai.use(chaiHttp);

describe('App', () => {
    it('should return a welcome message', (done) => {
        chai.request(server)
        .get('/')
        .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.message).to.equal('All Oki');
            done();
        });
    });
});