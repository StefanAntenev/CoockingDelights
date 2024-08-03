(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('http'), require('fs'), require('crypto')) :
        typeof define === 'function' && define.amd ? define(['http', 'fs', 'crypto'], factory) :
            (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Server = factory(global.http, global.fs, global.crypto));
}(this, (function (http, fs, crypto) {
    'use strict';

    function _interopDefaultLegacy(e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var http__default = /*#__PURE__*/_interopDefaultLegacy(http);
    var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
    var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);

    class ServiceError extends Error {
        constructor(message = 'Service Error') {
            super(message);
            this.name = 'ServiceError';
        }
    }

    class NotFoundError extends ServiceError {
        constructor(message = 'Resource not found') {
            super(message);
            this.name = 'NotFoundError';
            this.status = 404;
        }
    }

    class RequestError extends ServiceError {
        constructor(message = 'Request error') {
            super(message);
            this.name = 'RequestError';
            this.status = 400;
        }
    }

    class ConflictError extends ServiceError {
        constructor(message = 'Resource conflict') {
            super(message);
            this.name = 'ConflictError';
            this.status = 409;
        }
    }

    class AuthorizationError extends ServiceError {
        constructor(message = 'Unauthorized') {
            super(message);
            this.name = 'AuthorizationError';
            this.status = 401;
        }
    }

    class CredentialError extends ServiceError {
        constructor(message = 'Forbidden') {
            super(message);
            this.name = 'CredentialError';
            this.status = 403;
        }
    }

    var errors = {
        ServiceError,
        NotFoundError,
        RequestError,
        ConflictError,
        AuthorizationError,
        CredentialError
    };

    const { ServiceError: ServiceError$1 } = errors;


    function createHandler(plugins, services) {
        return async function handler(req, res) {
            const method = req.method;
            console.info(`<< ${req.method} ${req.url}`);

            // Redirect fix for admin panel relative paths
            if (req.url.slice(-6) == '/admin') {
                res.writeHead(302, {
                    'Location': `http://${req.headers.host}/admin/`
                });
                return res.end();
            }

            let status = 200;
            let headers = {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            };
            let result = '';
            let context;

            // NOTE: the OPTIONS method results in undefined result and also it never processes plugins - keep this in mind
            if (method == 'OPTIONS') {
                Object.assign(headers, {
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Credentials': false,
                    'Access-Control-Max-Age': '86400',
                    'Access-Control-Allow-Headers': 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-Authorization, X-Admin'
                });
            } else {
                try {
                    context = processPlugins();
                    await handle(context);
                } catch (err) {
                    if (err instanceof ServiceError$1) {
                        status = err.status || 400;
                        result = composeErrorObject(err.code || status, err.message);
                    } else {
                        // Unhandled exception, this is due to an error in the service code - REST consumers should never have to encounter this;
                        // If it happens, it must be debugged in a future version of the server
                        console.error(err);
                        status = 500;
                        result = composeErrorObject(500, 'Server Error');
                    }
                }
            }

            res.writeHead(status, headers);
            if (context != undefined && context.util != undefined && context.util.throttle) {
                await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
            }
            res.end(result);

            function processPlugins() {
                const context = { params: {} };
                plugins.forEach(decorate => decorate(context, req));
                return context;
            }

            async function handle(context) {
                const { serviceName, tokens, query, body } = await parseRequest(req);
                if (serviceName == 'admin') {
                    return ({ headers, result } = services['admin'](method, tokens, query, body));
                } else if (serviceName == 'favicon.ico') {
                    return ({ headers, result } = services['favicon'](method, tokens, query, body));
                }

                const service = services[serviceName];

                if (service === undefined) {
                    status = 400;
                    result = composeErrorObject(400, `Service "${serviceName}" is not supported`);
                    console.error('Missing service ' + serviceName);
                } else {
                    result = await service(context, { method, tokens, query, body });
                }

                // NOTE: logout does not return a result
                // in this case the content type header should be omitted, to allow checks on the client
                if (result !== undefined) {
                    result = JSON.stringify(result);
                } else {
                    status = 204;
                    delete headers['Content-Type'];
                }
            }
        };
    }



    function composeErrorObject(code, message) {
        return JSON.stringify({
            code,
            message
        });
    }

    async function parseRequest(req) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const tokens = url.pathname.split('/').filter(x => x.length > 0);
        const serviceName = tokens.shift();
        const queryString = url.search.split('?')[1] || '';
        const query = queryString
            .split('&')
            .filter(s => s != '')
            .map(x => x.split('='))
            .reduce((p, [k, v]) => Object.assign(p, { [k]: decodeURIComponent(v) }), {});
        const body = await parseBody(req);

        return {
            serviceName,
            tokens,
            query,
            body
        };
    }

    function parseBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk) => body += chunk.toString());
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (err) {
                    resolve(body);
                }
            });
        });
    }

    var requestHandler = createHandler;

    class Service {
        constructor() {
            this._actions = [];
            this.parseRequest = this.parseRequest.bind(this);
        }

        /**
         * Handle service request, after it has been processed by a request handler
         * @param {*} context Execution context, contains result of middleware processing
         * @param {{method: string, tokens: string[], query: *, body: *}} request Request parameters
         */
        async parseRequest(context, request) {
            for (let { method, name, handler } of this._actions) {
                if (method === request.method && matchAndAssignParams(context, request.tokens[0], name)) {
                    return await handler(context, request.tokens.slice(1), request.query, request.body);
                }
            }
        }

        /**
         * Register service action
         * @param {string} method HTTP method
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        registerAction(method, name, handler) {
            this._actions.push({ method, name, handler });
        }

        /**
         * Register GET action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        get(name, handler) {
            this.registerAction('GET', name, handler);
        }

        /**
         * Register POST action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        post(name, handler) {
            this.registerAction('POST', name, handler);
        }

        /**
         * Register PUT action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        put(name, handler) {
            this.registerAction('PUT', name, handler);
        }

        /**
         * Register PATCH action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        patch(name, handler) {
            this.registerAction('PATCH', name, handler);
        }

        /**
         * Register DELETE action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        delete(name, handler) {
            this.registerAction('DELETE', name, handler);
        }
    }

    function matchAndAssignParams(context, name, pattern) {
        if (pattern == '*') {
            return true;
        } else if (pattern[0] == ':') {
            context.params[pattern.slice(1)] = name;
            return true;
        } else if (name == pattern) {
            return true;
        } else {
            return false;
        }
    }

    var Service_1 = Service;

    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    var util = {
        uuid
    };

    const uuid$1 = util.uuid;


    const data = fs__default['default'].existsSync('./data') ? fs__default['default'].readdirSync('./data').reduce((p, c) => {
        const content = JSON.parse(fs__default['default'].readFileSync('./data/' + c));
        const collection = c.slice(0, -5);
        p[collection] = {};
        for (let endpoint in content) {
            p[collection][endpoint] = content[endpoint];
        }
        return p;
    }, {}) : {};

    const actions = {
        get: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;
            for (let token of tokens) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            return responseData;
        },
        post: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            // TODO handle collisions, replacement
            let responseData = data;
            for (let token of tokens) {
                if (responseData.hasOwnProperty(token) == false) {
                    responseData[token] = {};
                }
                responseData = responseData[token];
            }

            const newId = uuid$1();
            responseData[newId] = Object.assign({}, body, { _id: newId });
            return responseData[newId];
        },
        put: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            let responseData = data;
            for (let token of tokens.slice(0, -1)) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            if (responseData !== undefined && responseData[tokens.slice(-1)] !== undefined) {
                responseData[tokens.slice(-1)] = body;
            }
            return responseData[tokens.slice(-1)];
        },
        patch: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            let responseData = data;
            for (let token of tokens) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            if (responseData !== undefined) {
                Object.assign(responseData, body);
            }
            return responseData;
        },
        delete: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;

            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                if (responseData.hasOwnProperty(token) == false) {
                    return null;
                }
                if (i == tokens.length - 1) {
                    const body = responseData[token];
                    delete responseData[token];
                    return body;
                } else {
                    responseData = responseData[token];
                }
            }
        }
    };

    const dataService = new Service_1();
    dataService.get(':collection', actions.get);
    dataService.post(':collection', actions.post);
    dataService.put(':collection', actions.put);
    dataService.patch(':collection', actions.patch);
    dataService.delete(':collection', actions.delete);


    var jsonstore = dataService.parseRequest;

    /*
     * This service requires storage and auth plugins
     */

    const { AuthorizationError: AuthorizationError$1 } = errors;



    const userService = new Service_1();

    userService.get('me', getSelf);
    userService.post('register', onRegister);
    userService.post('login', onLogin);
    userService.get('logout', onLogout);


    function getSelf(context, tokens, query, body) {
        if (context.user) {
            const result = Object.assign({}, context.user);
            delete result.hashedPassword;
            return result;
        } else {
            throw new AuthorizationError$1();
        }
    }

    function onRegister(context, tokens, query, body) {
        return context.auth.register(body);
    }

    function onLogin(context, tokens, query, body) {
        return context.auth.login(body);
    }

    function onLogout(context, tokens, query, body) {
        return context.auth.logout();
    }

    var users = userService.parseRequest;

    const { NotFoundError: NotFoundError$1, RequestError: RequestError$1 } = errors;


    var crud = {
        get,
        post,
        put,
        patch,
        delete: del
    };


    function validateRequest(context, tokens, query) {
        /*
        if (context.params.collection == undefined) {
            throw new RequestError('Please, specify collection name');
        }
        */
        if (tokens.length > 1) {
            throw new RequestError$1();
        }
    }

    function parseWhere(query) {
        const operators = {
            '<=': (prop, value) => record => record[prop] <= JSON.parse(value),
            '<': (prop, value) => record => record[prop] < JSON.parse(value),
            '>=': (prop, value) => record => record[prop] >= JSON.parse(value),
            '>': (prop, value) => record => record[prop] > JSON.parse(value),
            '=': (prop, value) => record => record[prop] == JSON.parse(value),
            ' like ': (prop, value) => record => record[prop].toLowerCase().includes(JSON.parse(value).toLowerCase()),
            ' in ': (prop, value) => record => JSON.parse(`[${/\((.+?)\)/.exec(value)[1]}]`).includes(record[prop]),
        };
        const pattern = new RegExp(`^(.+?)(${Object.keys(operators).join('|')})(.+?)$`, 'i');

        try {
            let clauses = [query.trim()];
            let check = (a, b) => b;
            let acc = true;
            if (query.match(/ and /gi)) {
                // inclusive
                clauses = query.split(/ and /gi);
                check = (a, b) => a && b;
                acc = true;
            } else if (query.match(/ or /gi)) {
                // optional
                clauses = query.split(/ or /gi);
                check = (a, b) => a || b;
                acc = false;
            }
            clauses = clauses.map(createChecker);

            return (record) => clauses
                .map(c => c(record))
                .reduce(check, acc);
        } catch (err) {
            throw new Error('Could not parse WHERE clause, check your syntax.');
        }

        function createChecker(clause) {
            let [match, prop, operator, value] = pattern.exec(clause);
            [prop, value] = [prop.trim(), value.trim()];

            return operators[operator.toLowerCase()](prop, value);
        }
    }


    function get(context, tokens, query, body) {
        validateRequest(context, tokens);

        let responseData;

        try {
            if (query.where) {
                responseData = context.storage.get(context.params.collection).filter(parseWhere(query.where));
            } else if (context.params.collection) {
                responseData = context.storage.get(context.params.collection, tokens[0]);
            } else {
                // Get list of collections
                return context.storage.get();
            }

            if (query.sortBy) {
                const props = query.sortBy
                    .split(',')
                    .filter(p => p != '')
                    .map(p => p.split(' ').filter(p => p != ''))
                    .map(([p, desc]) => ({ prop: p, desc: desc ? true : false }));

                // Sorting priority is from first to last, therefore we sort from last to first
                for (let i = props.length - 1; i >= 0; i--) {
                    let { prop, desc } = props[i];
                    responseData.sort(({ [prop]: propA }, { [prop]: propB }) => {
                        if (typeof propA == 'number' && typeof propB == 'number') {
                            return (propA - propB) * (desc ? -1 : 1);
                        } else {
                            return propA.localeCompare(propB) * (desc ? -1 : 1);
                        }
                    });
                }
            }

            if (query.offset) {
                responseData = responseData.slice(Number(query.offset) || 0);
            }
            const pageSize = Number(query.pageSize) || 10;
            if (query.pageSize) {
                responseData = responseData.slice(0, pageSize);
            }

            if (query.distinct) {
                const props = query.distinct.split(',').filter(p => p != '');
                responseData = Object.values(responseData.reduce((distinct, c) => {
                    const key = props.map(p => c[p]).join('::');
                    if (distinct.hasOwnProperty(key) == false) {
                        distinct[key] = c;
                    }
                    return distinct;
                }, {}));
            }

            if (query.count) {
                return responseData.length;
            }

            if (query.select) {
                const props = query.select.split(',').filter(p => p != '');
                responseData = Array.isArray(responseData) ? responseData.map(transform) : transform(responseData);

                function transform(r) {
                    const result = {};
                    props.forEach(p => result[p] = r[p]);
                    return result;
                }
            }

            if (query.load) {
                const props = query.load.split(',').filter(p => p != '');
                props.map(prop => {
                    const [propName, relationTokens] = prop.split('=');
                    const [idSource, collection] = relationTokens.split(':');
                    console.log(`Loading related records from "${collection}" into "${propName}", joined on "_id"="${idSource}"`);
                    const storageSource = collection == 'users' ? context.protectedStorage : context.storage;
                    responseData = Array.isArray(responseData) ? responseData.map(transform) : transform(responseData);

                    function transform(r) {
                        const seekId = r[idSource];
                        const related = storageSource.get(collection, seekId);
                        delete related.hashedPassword;
                        r[propName] = related;
                        return r;
                    }
                });
            }

        } catch (err) {
            console.error(err);
            if (err.message.includes('does not exist')) {
                throw new NotFoundError$1();
            } else {
                throw new RequestError$1(err.message);
            }
        }

        context.canAccess(responseData);

        return responseData;
    }

    function post(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length > 0) {
            throw new RequestError$1('Use PUT to update records');
        }
        context.canAccess(undefined, body);

        body._ownerId = context.user._id;
        let responseData;

        try {
            responseData = context.storage.add(context.params.collection, body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function put(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing, body);

        try {
            responseData = context.storage.set(context.params.collection, tokens[0], body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function patch(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing, body);

        try {
            responseData = context.storage.merge(context.params.collection, tokens[0], body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function del(context, tokens, query, body) {
        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing);

        try {
            responseData = context.storage.delete(context.params.collection, tokens[0]);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    /*
     * This service requires storage and auth plugins
     */

    const dataService$1 = new Service_1();
    dataService$1.get(':collection', crud.get);
    dataService$1.post(':collection', crud.post);
    dataService$1.put(':collection', crud.put);
    dataService$1.patch(':collection', crud.patch);
    dataService$1.delete(':collection', crud.delete);

    var data$1 = dataService$1.parseRequest;

    const imgdata = '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Td4DLneAwSddMiRH8tMU8nng/Yy+KQsM3AKBNbe35j5OH4A0dbV8AxwcAqMFyl73eHd3e2//nmn29wOGi3Kv+RixSgAAEkxpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDQuNC4wLUV4aXYyIj4KIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgIHhtbG5zOmlwdGNFeHQ9Imh0dHA6Ly9pcHRjLm9yZy9zdGQvSXB0YzR4bXBFeHQvMjAwOC0wMi0yOS8iCiAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICB4bWxuczpwbHVzPSJodHRwOi8vbnMudXNlcGx1cy5vcmcvbGRmL3htcC8xLjAvIgogICAgeG1sbnM6R0lNUD0iaHR0cDovL3d3dy5naW1wLm9yZy94bXAvIgogICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgeG1sbnM6eG1wUmlnaHRzPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvcmlnaHRzLyIKICAgeG1wTU06RG9jdW1lbnRJRD0iZ2ltcDpkb2NpZDpnaW1wOjdjZDM3NWM3LTcwNmItNDlkMy1hOWRkLWNmM2Q3MmMwY2I4ZCIKICAgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2NGY2YTJlYy04ZjA5LTRkZTMtOTY3ZC05MTUyY2U5NjYxNTAiCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDoxMmE1NzI5Mi1kNmJkLTRlYjQtOGUxNi1hODEzYjMwZjU0NWYiCiAgIEdJTVA6QVBJPSIyLjAiCiAgIEdJTVA6UGxhdGZvcm09IldpbmRvd3MiCiAgIEdJTVA6VGltZVN0YW1wPSIxNjEzMzAwNzI5NTMwNjQzIgogICBHSU1QOlZlcnNpb249IjIuMTAuMTIiCiAgIGRjOkZvcm1hdD0iaW1hZ2UvcG5nIgogICBwaG90b3Nob3A6Q3JlZGl0PSJHZXR0eSBJbWFnZXMvaVN0b2NrcGhvdG8iCiAgIHhtcDpDcmVhdG9yVG9vbD0iR0lNUCAyLjEwIgogICB4bXBSaWdodHM6V2ViU3RhdGVtZW50PSJodHRwczovL3d3dy5pc3RvY2twaG90by5jb20vbGVnYWwvbGljZW5zZS1hZ3JlZW1lbnQ/dXRtX21lZGl1bT1vcmdhbmljJmFtcDt1dG1fc291cmNlPWdvb2dsZSZhbXA7dXRtX2NhbXBhaWduPWlwdGN1cmwiPgogICA8aXB0Y0V4dDpMb2NhdGlvbkNyZWF0ZWQ+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpMb2NhdGlvbkNyZWF0ZWQ+CiAgIDxpcHRjRXh0OkxvY2F0aW9uU2hvd24+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpMb2NhdGlvblNob3duPgogICA8aXB0Y0V4dDpBcnR3b3JrT3JPYmplY3Q+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpBcnR3b3JrT3JPYmplY3Q+CiAgIDxpcHRjRXh0OlJlZ2lzdHJ5SWQ+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpSZWdpc3RyeUlkPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJzYXZlZCIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIKICAgICAgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpjOTQ2M2MxMC05OWE4LTQ1NDQtYmRlOS1mNzY0ZjdhODJlZDkiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkdpbXAgMi4xMCAoV2luZG93cykiCiAgICAgIHN0RXZ0OndoZW49IjIwMjEtMDItMTRUMTM6MDU6MjkiLz4KICAgIDwvcmRmOlNlcT4KICAgPC94bXBNTTpIaXN0b3J5PgogICA8cGx1czpJbWFnZVN1cHBsaWVyPgogICAgPHJkZjpTZXEvPgogICA8L3BsdXM6SW1hZ2VTdXBwbGllcj4KICAgPHBsdXM6SW1hZ2VDcmVhdG9yPgogICAgPHJkZjpTZXEvPgogICA8L3BsdXM6SW1hZ2VDcmVhdG9yPgogICA8cGx1czpDb3B5cmlnaHRPd25lcj4KICAgIDxyZGY6U2VxLz4KICAgPC9wbHVzOkNvcHlyaWdodE93bmVyPgogICA8cGx1czpMaWNlbnNvcj4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgcGx1czpMaWNlbnNvclVSTD0iaHR0cHM6Ly93d3cuaXN0b2NrcGhvdG8uY29tL3Bob3RvL2xpY2Vuc2UtZ20xMTUwMzQ1MzQxLT91dG1fbWVkaXVtPW9yZ2FuaWMmYW1wO3V0bV9zb3VyY2U9Z29vZ2xlJmFtcDt1dG1fY2FtcGFpZ249aXB0Y3VybCIvPgogICAgPC9yZGY6U2VxPgogICA8L3BsdXM6TGljZW5zb3I+CiAgIDxkYzpjcmVhdG9yPgogICAgPHJkZjpTZXE+CiAgICAgPHJkZjpsaT5WbGFkeXNsYXYgU2VyZWRhPC9yZGY6bGk+CiAgICA8L3JkZjpTZXE+CiAgIDwvZGM6Y3JlYXRvcj4KICAgPGRjOmRlc2NyaXB0aW9uPgogICAgPHJkZjpBbHQ+CiAgICAgPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij5TZXJ2aWNlIHRvb2xzIGljb24gb24gd2hpdGUgYmFja2dyb3VuZC4gVmVjdG9yIGlsbHVzdHJhdGlvbi48L3JkZjpsaT4KICAgIDwvcmRmOkFsdD4KICAgPC9kYzpkZXNjcmlwdGlvbj4KICA8L3JkZjpEZXNjcmlwdGlvbj4KIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/PmWJCnkAAAAGYktHRAD/AP8A/6C9p5MAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQflAg4LBR0CZnO/AAAARHRFWHRDb21tZW50AFNlcnZpY2UgdG9vbHMgaWNvbiBvbiB3aGl0ZSBiYWNrZ3JvdW5kLiBWZWN0b3IgaWxsdXN0cmF0aW9uLlwvEeIAAAMxSURBVHja7Z1bcuQwCEX7qrLQXlp2ynxNVWbK7dgWj3sl9JvYRhxACD369erW7UMzx/cYaychonAQvXM5ABYkpynoYIiEGdoQog6AYfywBrCxF4zNrX/7McBbuXJe8rXx/KBDULcGsMREzCbeZ4J6ME/9wVH5d95rogZp3npEgPLP3m2iUSGqXBJS5Dr6hmLm8kRuZABYti5TMaailV8LodNQwTTUWk4/WZk75l0kM0aZQdaZjMqkrQDAuyMVJWFjMB4GANXr0lbZBxQKr7IjI7QvVWkok/Jn5UHVh61CYPs+/i7eL9j3y/Au8WqoAIC34k8/9k7N8miLcaGWHwgjZXE/awyYX7h41wKMCskZM2HXAddDkTdglpSjz5bcKPbcCEKwT3+DhxtVpJvkEC7rZSgq32NMSBoXaCdiahDCKrND0fpX8oQlVsQ8IFQZ1VARdIF5wroekAjB07gsAgDUIbQHFENIDEX4CQANIVe8Iw/ASiACLXl28eaf579OPuBa9/mrELUYHQ1t3KHlZZnRcXb2/c7ygXIQZqjDMEzeSrOgCAhqYMvTUE+FKXoVxTxgk3DEPREjGzj3nAk/VaKyB9GVIu4oMyOlrQZgrBBEFG9PAZTfs3amYDGrP9Wl964IeFvtz9JFluIvlEvcdoXDOdxggbDxGwTXcxFRi/LdirKgZUBm7SUdJG69IwSUzAMWgOAq/4hyrZVaJISSNWHFVbEoCFEhyBrCtXS9L+so9oTy8wGqxbQDD350WTjNESVFEB5hdKzUGcV5QtYxVWR2Ssl4Mg9qI9u6FCBInJRXgfEEgtS9Cgrg7kKouq4mdcDNBnEHQvWFTdgdgsqP+MiluVeBM13ahx09AYSWi50gsF+I6vn7BmCEoHR3NBzkpIOw4+XdVBBGQUioblaZHbGlodtB+N/jxqwLX/x/NARfD8ADxTOCKIcwE4Lw0OIbguMYcGTlymEpHYLXIKx8zQEqIfS2lGJPaADFEBR/PMH79ErqtpnZmTBlvM4wgihPWDEEhXn1LISj50crNgfCp+dWHYQRCfb2zgfnBZmKGAyi914anK9Coi4LOMhoAn3uVtn+AGnLKxPUZnCuAAAAAElFTkSuQmCC';
    const img = Buffer.from(imgdata, 'base64');

    var favicon = (method, tokens, query, body) => {
        console.log('serving favicon...');
        const headers = {
            'Content-Type': 'image/png',
            'Content-Length': img.length
        };
        let result = img;

        return {
            headers,
            result
        };
    };

    var require$$0 = "<!DOCTYPE html>\r\n<html lang=\"en\">\r\n<head>\r\n    <meta charset=\"UTF-8\">\r\n    <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\r\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n    <title>SUPS Admin Panel</title>\r\n    <style>\r\n        * {\r\n            padding: 0;\r\n            margin: 0;\r\n        }\r\n\r\n        body {\r\n            padding: 32px;\r\n            font-size: 16px;\r\n        }\r\n\r\n        .layout::after {\r\n            content: '';\r\n            clear: both;\r\n            display: table;\r\n        }\r\n\r\n        .col {\r\n            display: block;\r\n            float: left;\r\n        }\r\n\r\n        p {\r\n            padding: 8px 16px;\r\n        }\r\n\r\n        table {\r\n            border-collapse: collapse;\r\n        }\r\n\r\n        caption {\r\n            font-size: 120%;\r\n            text-align: left;\r\n            padding: 4px 8px;\r\n            font-weight: bold;\r\n            background-color: #ddd;\r\n        }\r\n\r\n        table, tr, th, td {\r\n            border: 1px solid #ddd;\r\n        }\r\n\r\n        th, td {\r\n            padding: 4px 8px;\r\n        }\r\n\r\n        ul {\r\n            list-style: none;\r\n        }\r\n\r\n        .collection-list a {\r\n            display: block;\r\n            width: 120px;\r\n            padding: 4px 8px;\r\n            text-decoration: none;\r\n            color: black;\r\n            background-color: #ccc;\r\n        }\r\n        .collection-list a:hover {\r\n            background-color: #ddd;\r\n        }\r\n        .collection-list a:visited {\r\n            color: black;\r\n        }\r\n    </style>\r\n    <script type=\"module\">\nimport { html, render } from 'https://unpkg.com/lit-html@1.3.0?module';\nimport { until } from 'https://unpkg.com/lit-html@1.3.0/directives/until?module';\n\nconst api = {\r\n    async get(url) {\r\n        return json(url);\r\n    },\r\n    async post(url, body) {\r\n        return json(url, {\r\n            method: 'POST',\r\n            headers: { 'Content-Type': 'application/json' },\r\n            body: JSON.stringify(body)\r\n        });\r\n    }\r\n};\r\n\r\nasync function json(url, options) {\r\n    return await (await fetch('/' + url, options)).json();\r\n}\r\n\r\nasync function getCollections() {\r\n    return api.get('data');\r\n}\r\n\r\nasync function getRecords(collection) {\r\n    return api.get('data/' + collection);\r\n}\r\n\r\nasync function getThrottling() {\r\n    return api.get('util/throttle');\r\n}\r\n\r\nasync function setThrottling(throttle) {\r\n    return api.post('util', { throttle });\r\n}\n\nasync function collectionList(onSelect) {\r\n    const collections = await getCollections();\r\n\r\n    return html`\r\n    <ul class=\"collection-list\">\r\n        ${collections.map(collectionLi)}\r\n    </ul>`;\r\n\r\n    function collectionLi(name) {\r\n        return html`<li><a href=\"javascript:void(0)\" @click=${(ev) => onSelect(ev, name)}>${name}</a></li>`;\r\n    }\r\n}\n\nasync function recordTable(collectionName) {\r\n    const records = await getRecords(collectionName);\r\n    const layout = getLayout(records);\r\n\r\n    return html`\r\n    <table>\r\n        <caption>${collectionName}</caption>\r\n        <thead>\r\n            <tr>${layout.map(f => html`<th>${f}</th>`)}</tr>\r\n        </thead>\r\n        <tbody>\r\n            ${records.map(r => recordRow(r, layout))}\r\n        </tbody>\r\n    </table>`;\r\n}\r\n\r\nfunction getLayout(records) {\r\n    const result = new Set(['_id']);\r\n    records.forEach(r => Object.keys(r).forEach(k => result.add(k)));\r\n\r\n    return [...result.keys()];\r\n}\r\n\r\nfunction recordRow(record, layout) {\r\n    return html`\r\n    <tr>\r\n        ${layout.map(f => html`<td>${JSON.stringify(record[f]) || html`<span>(missing)</span>`}</td>`)}\r\n    </tr>`;\r\n}\n\nasync function throttlePanel(display) {\r\n    const active = await getThrottling();\r\n\r\n    return html`\r\n    <p>\r\n        Request throttling: </span>${active}</span>\r\n        <button @click=${(ev) => set(ev, true)}>Enable</button>\r\n        <button @click=${(ev) => set(ev, false)}>Disable</button>\r\n    </p>`;\r\n\r\n    async function set(ev, state) {\r\n        ev.target.disabled = true;\r\n        await setThrottling(state);\r\n        display();\r\n    }\r\n}\n\n//import page from '//unpkg.com/page/page.mjs';\r\n\r\n\r\nfunction start() {\r\n    const main = document.querySelector('main');\r\n    editor(main);\r\n}\r\n\r\nasync function editor(main) {\r\n    let list = html`<div class=\"col\">Loading&hellip;</div>`;\r\n    let viewer = html`<div class=\"col\">\r\n    <p>Select collection to view records</p>\r\n</div>`;\r\n    display();\r\n\r\n    list = html`<div class=\"col\">${await collectionList(onSelect)}</div>`;\r\n    display();\r\n\r\n    async function display() {\r\n        render(html`\r\n        <section class=\"layout\">\r\n            ${until(throttlePanel(display), html`<p>Loading</p>`)}\r\n        </section>\r\n        <section class=\"layout\">\r\n            ${list}\r\n            ${viewer}\r\n        </section>`, main);\r\n    }\r\n\r\n    async function onSelect(ev, name) {\r\n        ev.preventDefault();\r\n        viewer = html`<div class=\"col\">${await recordTable(name)}</div>`;\r\n        display();\r\n    }\r\n}\r\n\r\nstart();\n\n</script>\r\n</head>\r\n<body>\r\n    <main>\r\n        Loading&hellip;\r\n    </main>\r\n</body>\r\n</html>";

    const mode = process.argv[2] == '-dev' ? 'dev' : 'prod';

    const files = {
        index: mode == 'prod' ? require$$0 : fs__default['default'].readFileSync('./client/index.html', 'utf-8')
    };

    var admin = (method, tokens, query, body) => {
        const headers = {
            'Content-Type': 'text/html'
        };
        let result = '';

        const resource = tokens.join('/');
        if (resource && resource.split('.').pop() == 'js') {
            headers['Content-Type'] = 'application/javascript';

            files[resource] = files[resource] || fs__default['default'].readFileSync('./client/' + resource, 'utf-8');
            result = files[resource];
        } else {
            result = files.index;
        }

        return {
            headers,
            result
        };
    };

    /*
     * This service requires util plugin
     */

    const utilService = new Service_1();

    utilService.post('*', onRequest);
    utilService.get(':service', getStatus);

    function getStatus(context, tokens, query, body) {
        return context.util[context.params.service];
    }

    function onRequest(context, tokens, query, body) {
        Object.entries(body).forEach(([k, v]) => {
            console.log(`${k} ${v ? 'enabled' : 'disabled'}`);
            context.util[k] = v;
        });
        return '';
    }

    var util$1 = utilService.parseRequest;

    var services = {
        jsonstore,
        users,
        data: data$1,
        favicon,
        admin,
        util: util$1
    };

    const { uuid: uuid$2 } = util;


    function initPlugin(settings) {
        const storage = createInstance(settings.seedData);
        const protectedStorage = createInstance(settings.protectedData);

        return function decoreateContext(context, request) {
            context.storage = storage;
            context.protectedStorage = protectedStorage;
        };
    }


    /**
     * Create storage instance and populate with seed data
     * @param {Object=} seedData Associative array with data. Each property is an object with properties in format {key: value}
     */
    function createInstance(seedData = {}) {
        const collections = new Map();

        // Initialize seed data from file    
        for (let collectionName in seedData) {
            if (seedData.hasOwnProperty(collectionName)) {
                const collection = new Map();
                for (let recordId in seedData[collectionName]) {
                    if (seedData.hasOwnProperty(collectionName)) {
                        collection.set(recordId, seedData[collectionName][recordId]);
                    }
                }
                collections.set(collectionName, collection);
            }
        }


        // Manipulation

        /**
         * Get entry by ID or list of all entries from collection or list of all collections
         * @param {string=} collection Name of collection to access. Throws error if not found. If omitted, returns list of all collections.
         * @param {number|string=} id ID of requested entry. Throws error if not found. If omitted, returns of list all entries in collection.
         * @return {Object} Matching entry.
         */
        function get(collection, id) {
            if (!collection) {
                return [...collections.keys()];
            }
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!id) {
                const entries = [...targetCollection.entries()];
                let result = entries.map(([k, v]) => {
                    return Object.assign(deepCopy(v), { _id: k });
                });
                return result;
            }
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }
            const entry = targetCollection.get(id);
            return Object.assign(deepCopy(entry), { _id: id });
        }

        /**
         * Add new entry to collection. ID will be auto-generated
         * @param {string} collection Name of collection to access. If the collection does not exist, it will be created.
         * @param {Object} data Value to store.
         * @return {Object} Original value with resulting ID under _id property.
         */
        function add(collection, data) {
            const record = assignClean({ _ownerId: data._ownerId }, data);

            let targetCollection = collections.get(collection);
            if (!targetCollection) {
                targetCollection = new Map();
                collections.set(collection, targetCollection);
            }
            let id = uuid$2();
            // Make sure new ID does not match existing value
            while (targetCollection.has(id)) {
                id = uuid$2();
            }

            record._createdOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Replace entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @param {Object} data Value to store. Record will be replaced!
         * @return {Object} Updated entry.
         */
        function set(collection, id, data) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }

            const existing = targetCollection.get(id);
            const record = assignSystemProps(deepCopy(data), existing);
            record._updatedOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Modify entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @param {Object} data Value to store. Shallow merge will be performed!
         * @return {Object} Updated entry.
         */
        function merge(collection, id, data) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }

            const existing = deepCopy(targetCollection.get(id));
            const record = assignClean(existing, data);
            record._updatedOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Delete entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @return {{_deletedOn: number}} Server time of deletion.
         */
        function del(collection, id) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }
            targetCollection.delete(id);

            return { _deletedOn: Date.now() };
        }

        /**
         * Search in collection by query object
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {Object} query Query object. Format {prop: value}.
         * @return {Object[]} Array of matching entries.
         */
        function query(collection, query) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            const result = [];
            // Iterate entries of target collection and compare each property with the given query
            for (let [key, entry] of [...targetCollection.entries()]) {
                let match = true;
                for (let prop in entry) {
                    if (query.hasOwnProperty(prop)) {
                        const targetValue = query[prop];
                        // Perform lowercase search, if value is string
                        if (typeof targetValue === 'string' && typeof entry[prop] === 'string') {
                            if (targetValue.toLocaleLowerCase() !== entry[prop].toLocaleLowerCase()) {
                                match = false;
                                break;
                            }
                        } else if (targetValue != entry[prop]) {
                            match = false;
                            break;
                        }
                    }
                }

                if (match) {
                    result.push(Object.assign(deepCopy(entry), { _id: key }));
                }
            }

            return result;
        }

        return { get, add, set, merge, delete: del, query };
    }


    function assignSystemProps(target, entry, ...rest) {
        const whitelist = [
            '_id',
            '_createdOn',
            '_updatedOn',
            '_ownerId'
        ];
        for (let prop of whitelist) {
            if (entry.hasOwnProperty(prop)) {
                target[prop] = deepCopy(entry[prop]);
            }
        }
        if (rest.length > 0) {
            Object.assign(target, ...rest);
        }

        return target;
    }


    function assignClean(target, entry, ...rest) {
        const blacklist = [
            '_id',
            '_createdOn',
            '_updatedOn',
            '_ownerId'
        ];
        for (let key in entry) {
            if (blacklist.includes(key) == false) {
                target[key] = deepCopy(entry[key]);
            }
        }
        if (rest.length > 0) {
            Object.assign(target, ...rest);
        }

        return target;
    }

    function deepCopy(value) {
        if (Array.isArray(value)) {
            return value.map(deepCopy);
        } else if (typeof value == 'object') {
            return [...Object.entries(value)].reduce((p, [k, v]) => Object.assign(p, { [k]: deepCopy(v) }), {});
        } else {
            return value;
        }
    }

    var storage = initPlugin;

    const { ConflictError: ConflictError$1, CredentialError: CredentialError$1, RequestError: RequestError$2 } = errors;

    function initPlugin$1(settings) {
        const identity = settings.identity;

        return function decorateContext(context, request) {
            context.auth = {
                register,
                login,
                logout
            };

            const userToken = request.headers['x-authorization'];
            if (userToken !== undefined) {
                let user;
                const session = findSessionByToken(userToken);
                if (session !== undefined) {
                    const userData = context.protectedStorage.get('users', session.userId);
                    if (userData !== undefined) {
                        console.log('Authorized as ' + userData[identity]);
                        user = userData;
                    }
                }
                if (user !== undefined) {
                    context.user = user;
                } else {
                    throw new CredentialError$1('Invalid access token');
                }
            }

            function register(body) {
                if (body.hasOwnProperty(identity) === false ||
                    body.hasOwnProperty('password') === false ||
                    body[identity].length == 0 ||
                    body.password.length == 0) {
                    throw new RequestError$2('Missing fields');
                } else if (context.protectedStorage.query('users', { [identity]: body[identity] }).length !== 0) {
                    throw new ConflictError$1(`A user with the same ${identity} already exists`);
                } else {
                    const newUser = Object.assign({}, body, {
                        [identity]: body[identity],
                        hashedPassword: hash(body.password)
                    });
                    const result = context.protectedStorage.add('users', newUser);
                    delete result.hashedPassword;

                    const session = saveSession(result._id);
                    result.accessToken = session.accessToken;

                    return result;
                }
            }

            function login(body) {
                const targetUser = context.protectedStorage.query('users', { [identity]: body[identity] });
                if (targetUser.length == 1) {
                    if (hash(body.password) === targetUser[0].hashedPassword) {
                        const result = targetUser[0];
                        delete result.hashedPassword;

                        const session = saveSession(result._id);
                        result.accessToken = session.accessToken;

                        return result;
                    } else {
                        throw new CredentialError$1('Login or password don\'t match');
                    }
                } else {
                    throw new CredentialError$1('Login or password don\'t match');
                }
            }

            function logout() {
                if (context.user !== undefined) {
                    const session = findSessionByUserId(context.user._id);
                    if (session !== undefined) {
                        context.protectedStorage.delete('sessions', session._id);
                    }
                } else {
                    throw new CredentialError$1('User session does not exist');
                }
            }

            function saveSession(userId) {
                let session = context.protectedStorage.add('sessions', { userId });
                const accessToken = hash(session._id);
                session = context.protectedStorage.set('sessions', session._id, Object.assign({ accessToken }, session));
                return session;
            }

            function findSessionByToken(userToken) {
                return context.protectedStorage.query('sessions', { accessToken: userToken })[0];
            }

            function findSessionByUserId(userId) {
                return context.protectedStorage.query('sessions', { userId })[0];
            }
        };
    }


    const secret = 'This is not a production server';

    function hash(string) {
        const hash = crypto__default['default'].createHmac('sha256', secret);
        hash.update(string);
        return hash.digest('hex');
    }

    var auth = initPlugin$1;

    function initPlugin$2(settings) {
        const util = {
            throttle: false
        };

        return function decoreateContext(context, request) {
            context.util = util;
        };
    }

    var util$2 = initPlugin$2;

    /*
     * This plugin requires auth and storage plugins
     */

    const { RequestError: RequestError$3, ConflictError: ConflictError$2, CredentialError: CredentialError$2, AuthorizationError: AuthorizationError$2 } = errors;

    function initPlugin$3(settings) {
        const actions = {
            'GET': '.read',
            'POST': '.create',
            'PUT': '.update',
            'PATCH': '.update',
            'DELETE': '.delete'
        };
        const rules = Object.assign({
            '*': {
                '.create': ['User'],
                '.update': ['Owner'],
                '.delete': ['Owner']
            }
        }, settings.rules);

        return function decorateContext(context, request) {
            // special rules (evaluated at run-time)
            const get = (collectionName, id) => {
                return context.storage.get(collectionName, id);
            };
            const isOwner = (user, object) => {
                return user._id == object._ownerId;
            };
            context.rules = {
                get,
                isOwner
            };
            const isAdmin = request.headers.hasOwnProperty('x-admin');

            context.canAccess = canAccess;

            function canAccess(data, newData) {
                const user = context.user;
                const action = actions[request.method];
                let { rule, propRules } = getRule(action, context.params.collection, data);

                if (Array.isArray(rule)) {
                    rule = checkRoles(rule, data);
                } else if (typeof rule == 'string') {
                    rule = !!(eval(rule));
                }
                if (!rule && !isAdmin) {
                    throw new CredentialError$2();
                }
                propRules.map(r => applyPropRule(action, r, user, data, newData));
            }

            function applyPropRule(action, [prop, rule], user, data, newData) {
                // NOTE: user needs to be in scope for eval to work on certain rules
                if (typeof rule == 'string') {
                    rule = !!eval(rule);
                }

                if (rule == false) {
                    if (action == '.create' || action == '.update') {
                        delete newData[prop];
                    } else if (action == '.read') {
                        delete data[prop];
                    }
                }
            }

            function checkRoles(roles, data, newData) {
                if (roles.includes('Guest')) {
                    return true;
                } else if (!context.user && !isAdmin) {
                    throw new AuthorizationError$2();
                } else if (roles.includes('User')) {
                    return true;
                } else if (context.user && roles.includes('Owner')) {
                    return context.user._id == data._ownerId;
                } else {
                    return false;
                }
            }
        };



        function getRule(action, collection, data = {}) {
            let currentRule = ruleOrDefault(true, rules['*'][action]);
            let propRules = [];

            // Top-level rules for the collection
            const collectionRules = rules[collection];
            if (collectionRules !== undefined) {
                // Top-level rule for the specific action for the collection
                currentRule = ruleOrDefault(currentRule, collectionRules[action]);

                // Prop rules
                const allPropRules = collectionRules['*'];
                if (allPropRules !== undefined) {
                    propRules = ruleOrDefault(propRules, getPropRule(allPropRules, action));
                }

                // Rules by record id 
                const recordRules = collectionRules[data._id];
                if (recordRules !== undefined) {
                    currentRule = ruleOrDefault(currentRule, recordRules[action]);
                    propRules = ruleOrDefault(propRules, getPropRule(recordRules, action));
                }
            }

            return {
                rule: currentRule,
                propRules
            };
        }

        function ruleOrDefault(current, rule) {
            return (rule === undefined || rule.length === 0) ? current : rule;
        }

        function getPropRule(record, action) {
            const props = Object
                .entries(record)
                .filter(([k]) => k[0] != '.')
                .filter(([k, v]) => v.hasOwnProperty(action))
                .map(([k, v]) => [k, v[action]]);

            return props;
        }
    }

    var rules = initPlugin$3;

    var identity = "email";
    var protectedData = {
        users: {
            "35c62d76-8152-4626-8712-eeb96381bea8": {
                email: "peter@abv.bg",
                username: "Peter",
                hashedPassword: "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1"
            },
            "847ec027-f659-4086-8032-5173e2f9c93a": {
                email: "george@abv.bg",
                username: "George",
                hashedPassword: "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1"
            },
            "60f0cf0b-34b0-4abd-9769-8c42f830dffc": {
                email: "admin@abv.bg",
                username: "Admin",
                hashedPassword: "fac7060c3e17e6f151f247eacb2cd5ae80b8c36aedb8764e18a41bbdc16aa302"
            }
        },
        sessions: {
        }
    };
    var seedData = {
        recipes: {
            "3987279d-0ad4-4afb-8ca9-5b256ae3b298": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                name: "Easy Lasagna",
                img: "assets/lasagna.jpg",
                ingredients: [
                    "1 tbsp Ingredient 1",
                    "2 cups Ingredient 2",
                    "500 g  Ingredient 3",
                    "25 g Ingredient 4"
                ],
                steps: [
                    "Prepare ingredients",
                    "Mix ingredients",
                    "Cook until done"
                ],
                _createdOn: 1613551279012
            },
            "8f414b4f-ab39-4d36-bedb-2ad69da9c830": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                name: "Grilled Duck Fillet",
                img: "assets/roast.jpg",
                ingredients: [
                    "500 g  Ingredient 1",
                    "3 tbsp Ingredient 2",
                    "2 cups Ingredient 3"
                ],
                steps: [
                    "Prepare ingredients",
                    "Mix ingredients",
                    "Cook until done"
                ],
                _createdOn: 1613551344360
            },
            "985d9eab-ad2e-4622-a5c8-116261fb1fd2": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                name: "Roast Trout",
                img: "assets/fish.jpg",
                ingredients: [
                    "4 cups Ingredient 1",
                    "1 tbsp Ingredient 2",
                    "1 tbsp Ingredient 3",
                    "750 g  Ingredient 4",
                    "25 g Ingredient 5"
                ],
                steps: [
                    "Prepare ingredients",
                    "Mix ingredients",
                    "Cook until done"
                ],
                _createdOn: 1613551388703
            }
        },
        comments: {
            "0a272c58-b7ea-4e09-a000-7ec988248f66": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                content: "Great recipe!",
                recipeId: "8f414b4f-ab39-4d36-bedb-2ad69da9c830",
                _createdOn: 1614260681375,
                _id: "0a272c58-b7ea-4e09-a000-7ec988248f66"
            }
        },
        records: {
            i01: {
                name: "John1",
                val: 1,
                _createdOn: 1613551388703
            },
            i02: {
                name: "John2",
                val: 1,
                _createdOn: 1613551388713
            },
            i03: {
                name: "John3",
                val: 2,
                _createdOn: 1613551388723
            },
            i04: {
                name: "John4",
                val: 2,
                _createdOn: 1613551388733
            },
            i05: {
                name: "John5",
                val: 2,
                _createdOn: 1613551388743
            },
            i06: {
                name: "John6",
                val: 3,
                _createdOn: 1613551388753
            },
            i07: {
                name: "John7",
                val: 3,
                _createdOn: 1613551388763
            },
            i08: {
                name: "John8",
                val: 2,
                _createdOn: 1613551388773
            },
            i09: {
                name: "John9",
                val: 3,
                _createdOn: 1613551388783
            },
            i10: {
                name: "John10",
                val: 1,
                _createdOn: 1613551388793
            }
        },
        catches: {
            "07f260f4-466c-4607-9a33-f7273b24f1b4": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                angler: "Paulo Admorim",
                weight: 636,
                species: "Atlantic Blue Marlin",
                location: "Vitoria, Brazil",
                bait: "trolled pink",
                captureTime: 80,
                _createdOn: 1614760714812,
                _id: "07f260f4-466c-4607-9a33-f7273b24f1b4"
            },
            "bdabf5e9-23be-40a1-9f14-9117b6702a9d": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                angler: "John Does",
                weight: 554,
                species: "Atlantic Blue Marlin",
                location: "Buenos Aires, Argentina",
                bait: "trolled pink",
                captureTime: 120,
                _createdOn: 1614760782277,
                _id: "bdabf5e9-23be-40a1-9f14-9117b6702a9d"
            }
        },
        furniture: {
        },
        orders: {
        },
        movies: {
            "1240549d-f0e0-497e-ab99-eb8f703713d7": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                title: "Black Widow",
                description: "Natasha Romanoff aka Black Widow confronts the darker parts of her ledger when a dangerous conspiracy with ties to her past arises. Comes on the screens 2020.",
                img: "https://miro.medium.com/max/735/1*akkAa2CcbKqHsvqVusF3-w.jpeg",
                _createdOn: 1614935055353,
                _id: "1240549d-f0e0-497e-ab99-eb8f703713d7"
            },
            "143e5265-333e-4150-80e4-16b61de31aa0": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                title: "Wonder Woman 1984",
                description: "Diana must contend with a work colleague and businessman, whose desire for extreme wealth sends the world down a path of destruction, after an ancient artifact that grants wishes goes missing.",
                img: "https://pbs.twimg.com/media/ETINgKwWAAAyA4r.jpg",
                _createdOn: 1614935181470,
                _id: "143e5265-333e-4150-80e4-16b61de31aa0"
            },
            "a9bae6d8-793e-46c4-a9db-deb9e3484909": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                title: "Top Gun 2",
                description: "After more than thirty years of service as one of the Navy's top aviators, Pete Mitchell is where he belongs, pushing the envelope as a courageous test pilot and dodging the advancement in rank that would ground him.",
                img: "https://i.pinimg.com/originals/f2/a4/58/f2a458048757bc6914d559c9e4dc962a.jpg",
                _createdOn: 1614935268135,
                _id: "a9bae6d8-793e-46c4-a9db-deb9e3484909"
            }
        },
        likes: {
        },
        ideas: {
            "833e0e57-71dc-42c0-b387-0ce0caf5225e": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                title: "Best Pilates Workout To Do At Home",
                description: "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Minima possimus eveniet ullam aspernatur corporis tempore quia nesciunt nostrum mollitia consequatur. At ducimus amet aliquid magnam nulla sed totam blanditiis ullam atque facilis corrupti quidem nisi iusto saepe, consectetur culpa possimus quos? Repellendus, dicta pariatur! Delectus, placeat debitis error dignissimos nesciunt magni possimus quo nulla, fuga corporis maxime minus nihil doloremque aliquam quia recusandae harum. Molestias dolorum recusandae commodi velit cum sapiente placeat alias rerum illum repudiandae? Suscipit tempore dolore autem, neque debitis quisquam molestias officia hic nesciunt? Obcaecati optio fugit blanditiis, explicabo odio at dicta asperiores distinctio expedita dolor est aperiam earum! Molestias sequi aliquid molestiae, voluptatum doloremque saepe dignissimos quidem quas harum quo. Eum nemo voluptatem hic corrupti officiis eaque et temporibus error totam numquam sequi nostrum assumenda eius voluptatibus quia sed vel, rerum, excepturi maxime? Pariatur, provident hic? Soluta corrupti aspernatur exercitationem vitae accusantium ut ullam dolor quod!",
                img: "./images/best-pilates-youtube-workouts-2__medium_4x3.jpg",
                _createdOn: 1615033373504,
                _id: "833e0e57-71dc-42c0-b387-0ce0caf5225e"
            },
            "247efaa7-8a3e-48a7-813f-b5bfdad0f46c": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                title: "4 Eady DIY Idea To Try!",
                description: "Similique rem culpa nemo hic recusandae perspiciatis quidem, quia expedita, sapiente est itaque optio enim placeat voluptates sit, fugit dignissimos tenetur temporibus exercitationem in quis magni sunt vel. Corporis officiis ut sapiente exercitationem consectetur debitis suscipit laborum quo enim iusto, labore, quod quam libero aliquid accusantium! Voluptatum quos porro fugit soluta tempore praesentium ratione dolorum impedit sunt dolores quod labore laudantium beatae architecto perspiciatis natus cupiditate, iure quia aliquid, iusto modi esse!",
                img: "./images/brightideacropped.jpg",
                _createdOn: 1615033452480,
                _id: "247efaa7-8a3e-48a7-813f-b5bfdad0f46c"
            },
            "b8608c22-dd57-4b24-948e-b358f536b958": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                title: "Dinner Recipe",
                description: "Consectetur labore et corporis nihil, officiis tempora, hic ex commodi sit aspernatur ad minima? Voluptas nesciunt, blanditiis ex nulla incidunt facere tempora laborum ut aliquid beatae obcaecati quidem reprehenderit consequatur quis iure natus quia totam vel. Amet explicabo quidem repellat unde tempore et totam minima mollitia, adipisci vel autem, enim voluptatem quasi exercitationem dolor cum repudiandae dolores nostrum sit ullam atque dicta, tempora iusto eaque! Rerum debitis voluptate impedit corrupti quibusdam consequatur minima, earum asperiores soluta. A provident reiciendis voluptates et numquam totam eveniet! Dolorum corporis libero dicta laborum illum accusamus ullam?",
                img: "./images/dinner.jpg",
                _createdOn: 1615033491967,
                _id: "b8608c22-dd57-4b24-948e-b358f536b958"
            }
        },
        catalog: {
            "53d4dbf5-7f41-47ba-b485-43eccb91cb95": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                make: "Table",
                model: "Swedish",
                year: 2015,
                description: "Medium table",
                price: 235,
                img: "./images/table.png",
                material: "Hardwood",
                _createdOn: 1615545143015,
                _id: "53d4dbf5-7f41-47ba-b485-43eccb91cb95"
            },
            "f5929b5c-bca4-4026-8e6e-c09e73908f77": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                make: "Sofa",
                model: "ES-549-M",
                year: 2018,
                description: "Three-person sofa, blue",
                price: 1200,
                img: "./images/sofa.jpg",
                material: "Frame - steel, plastic; Upholstery - fabric",
                _createdOn: 1615545572296,
                _id: "f5929b5c-bca4-4026-8e6e-c09e73908f77"
            },
            "c7f51805-242b-45ed-ae3e-80b68605141b": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                make: "Chair",
                model: "Bright Dining Collection",
                year: 2017,
                description: "Dining chair",
                price: 180,
                img: "./images/chair.jpg",
                material: "Wood laminate; leather",
                _createdOn: 1615546332126,
                _id: "c7f51805-242b-45ed-ae3e-80b68605141b"
            }
        },
        teams: {
            "34a1cab1-81f1-47e5-aec3-ab6c9810efe1": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                name: "Storm Troopers",
                logoUrl: "/assets/atat.png",
                description: "These ARE the droids we're looking for",
                _createdOn: 1615737591748,
                _id: "34a1cab1-81f1-47e5-aec3-ab6c9810efe1"
            },
            "dc888b1a-400f-47f3-9619-07607966feb8": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                name: "Team Rocket",
                logoUrl: "/assets/rocket.png",
                description: "Gotta catch 'em all!",
                _createdOn: 1615737655083,
                _id: "dc888b1a-400f-47f3-9619-07607966feb8"
            },
            "733fa9a1-26b6-490d-b299-21f120b2f53a": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                name: "Minions",
                logoUrl: "/assets/hydrant.png",
                description: "Friendly neighbourhood jelly beans, helping evil-doers succeed.",
                _createdOn: 1615737688036,
                _id: "733fa9a1-26b6-490d-b299-21f120b2f53a"
            }
        },
        members: {
            "cc9b0a0f-655d-45d7-9857-0a61c6bb2c4d": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                teamId: "34a1cab1-81f1-47e5-aec3-ab6c9810efe1",
                status: "member",
                _createdOn: 1616236790262,
                _updatedOn: 1616236792930
            },
            "61a19986-3b86-4347-8ca4-8c074ed87591": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                teamId: "dc888b1a-400f-47f3-9619-07607966feb8",
                status: "member",
                _createdOn: 1616237188183,
                _updatedOn: 1616237189016
            },
            "8a03aa56-7a82-4a6b-9821-91349fbc552f": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                teamId: "733fa9a1-26b6-490d-b299-21f120b2f53a",
                status: "member",
                _createdOn: 1616237193355,
                _updatedOn: 1616237195145
            },
            "9be3ac7d-2c6e-4d74-b187-04105ab7e3d6": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                teamId: "dc888b1a-400f-47f3-9619-07607966feb8",
                status: "member",
                _createdOn: 1616237231299,
                _updatedOn: 1616237235713
            },
            "280b4a1a-d0f3-4639-aa54-6d9158365152": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                teamId: "dc888b1a-400f-47f3-9619-07607966feb8",
                status: "member",
                _createdOn: 1616237257265,
                _updatedOn: 1616237278248
            },
            "e797fa57-bf0a-4749-8028-72dba715e5f8": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                teamId: "34a1cab1-81f1-47e5-aec3-ab6c9810efe1",
                status: "member",
                _createdOn: 1616237272948,
                _updatedOn: 1616237293676
            }
        },
        recipies: {
            "9f0d6863-a012-4acd-8de5-8475b63e66e7": {
                _id: "9f0d6863-a012-4acd-8de5-8475b63e66e7",
                name: "Spaghetti Carbonara",
                image: "https://static01.nyt.com/images/2021/02/14/dining/carbonara-horizontal/carbonara-horizontal-master768-v2.jpg?width=1280&quality=75&auto=webprecipe1.jpg",
                description: "A classic Italian pasta dish made with eggs, cheese, pancetta, and pepper.",
                Ingredients: "8 oz spaghetti, 2 large eggs, 1 cup grated Pecorino Romano cheese, 4 oz pancetta, 2 cloves garlic, 1/2 tsp black pepper, 1/4 cup chopped parsley",
                Instructions: "1. Bring a large pot of salted water to a boil. Add the spaghetti and cook until al dente. 2. In a bowl, whisk together the eggs and cheese. 3. In a large skillet, cook the pancetta until crispy. Add the garlic and cook until fragrant. 4. Add the cooked spaghetti to the skillet and toss to combine. 5. Remove the skillet from the heat and add the egg mixture, tossing quickly to coat the pasta. 6. Season with black pepper and garnish with parsley before serving.",
            },
            "9f0d6863-a012-4acd-8de5-8475b63e66e5": {
                _id: "9f0d6863-a012-4acd-8de5-8475b63e66e5",
                name: "Chicken Alfredo",
                image: "https://www.budgetbytes.com/wp-content/uploads/2022/07/Chicken-Alfredo-above-500x500.jpg",
                description: "Creamy and rich, this chicken Alfredo recipe is perfect for a family dinner.",
                Ingredients: "8 oz. fettuccine, 2 Tbsp butter, 1 lb. boneless, skinless chicken breast, 1 clove garlic, 1 cup heavy cream, 1 cup whole milk, 1 cup grated Parmesan, 1/4 tsp salt, 1/4 tsp pepper, 1/4 tsp nutmeg, 1/2 bunch fresh parsley",
                Instructions: "1.Bring a large pot of water to a boil for the fettuccine. Once boiling, add the fettuccine and continue to boil until tender. Drain the fettuccine in a colander.2.While the pasta is cooking, prepare the chicken and Alfredo sauce. Add the butter to a large skillet and place it over medium heat. Once the butter is melted and hot, add the chicken breast. Cook the chicken breast on both sides until golden brown and cooked through (about 5 minutes per side). Remove the chicken from the skillet and let it rest for five minutes.3.While the chicken is resting, mince the garlic and add it to the skillet with the chicken drippings. Sauté the garlic for about one minute, then add the heavy cream, milk, Parmesan, salt, pepper, and nutmeg. Stir and heat the sauce over medium heat until it begins to simmer, then reduce the heat to low.4.Slice the chicken into thin strips. Roughly chop the parsley. Add the sliced chicken and cooked fettuccine to the skillet with the Alfredo sauce. Toss the ingredients until everything is coated in sauce and heated through.5.Top the pasta with the chopped parsley just before serving."
                },
            "9f0d6863-a012-4acd-8de5-8475b63e66e2": {
                _id: "9f0d6863-a012-4acd-8de5-8475b63e66e2",
                name: "Vegetable Stir-fry",
                image: "https://images.immediate.co.uk/production/volatile/sites/30/2008/01/Vegetable-stir-fry-b669c05.jpg",
                description: "A quick and healthy meal full of fresh vegetables and savory sauce.",
                Ingredients: "1 cup broccoli florets, 1 cup sliced bell peppers, 1 cup sliced carrots, 1 cup sliced mushrooms, 1 cup snap peas, 1/4 cup soy sauce, 1/4 cup hoisin sauce, 1 Tbsp sesame oil, 1 Tbsp cornstarch, 1 Tbsp vegetable oil, 2 cloves garlic, 1 tsp grated ginger, 1/4 cup sliced green onions",
                Instructions: "1. In a small bowl, whisk together the soy sauce, hoisin sauce, sesame oil, and cornstarch. Set aside. 2. Heat the vegetable oil in a large skillet over medium-high heat. Add the garlic and ginger and sauté for about 30 seconds. 3. Add the broccoli, bell peppers, carrots, mushrooms, and snap peas to the skillet. Stir-fry the vegetables for about 5 minutes, or until they are crisp-tender. 4. Pour the sauce over the vegetables and toss to coat. Cook for an additional 2-3 minutes, or until the sauce has thickened. 5. Remove the skillet from the heat and stir in the sliced green onions. Serve the vegetable stir-fry over cooked rice or noodles."
                },
            "9f0d6863-a012-4acd-8de5-8475b63e66e1": {
                _id: "9f0d6863-a012-4acd-8de5-8475b63e66e1",
                name: "Fried Chicken",
                image: "https://www.tasteofhome.com/wp-content/uploads/2018/01/Crispy-Fried-Chicken_EXPS_TOHJJ22_6445_DR-_02_03_11b.jpg",
                description: "A quick and healthy meal full of fresh vegetables and savory sauce.",
                Ingredients: "Chicken: 3 lb drumsticks or thighs, 4 cups whole milk, can sub with water, 1/4 cup salt, 8 cloves garlic, 2 tbsp black peppercorns, 3 bay leaves Seasoning Mix: 2 cups flour, you can substitute with equal amounts Gluten-Free Four – Bobs Red Mill or King Arthur is recommended, 2 cups cornstarch, 2 tbsp kosher salt, 1/2 tbsp white pepper, 1 tbsp black pepper, 1 tbsp garlic powder, 1 tbsp onion powder, 1/2 tbsp cayenne pepper, 1 tbsp baking powder Wet Batter, 1 cup seasoning mix, 1 cup water, cold",
                Instructions: "1.Pierce chicken carefully with a knife and brine with whole milk (or water), salt, garlic, black peppercorns, and bay leaves. Brine for 2-3 hours or overnight for best results. 2.In a large mixing bowl, combine flour, cornstarch, kosher salt, white pepper, black pepper, garlic powder, onion powder, cayenne pepper and baking powder and whisk until combined. 3.Take 1 cup of your seasoning mix and combine in a separate bowl with cold water and mix until smooth. 4.Remove the chicken from the brine and spoon a few tablespoons of brine into the seasoning mix and rub together with your hands to create small clumps. These craggily bits will add extra texture to the chicken. 5.Dip each piece of chicken in the wet batter and let any excess drip off. Immediately dredge in seasoning mix and press the mix into the chicken until completely coated. Let rest on a baking sheet while you heat up your oil. 6.In a large cast iron pan, dutch oven, or heavy bottomed pan/wok, fry chicken at 350F for 8-12 minutes (depending on size of the chicken) until the internal temperature reads 165F."
                },
            "73b90f56-c9ce-40e7-84e7-a0592bef672a": {
                _id: "73b90f56-c9ce-40e7-84e7-a0592bef672a",
                name: "Homemade Margherita Pizza",
                image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0BN__1hvPzzXQL7WgzLmYO0cqfRtE26Qk3A&s",
                description: "A quick and healthy meal full of fresh vegetables and savory sauce.",
                Ingredients: "Homemade Pizza Dough:, 2½ cups (300 g) unbleached all-purpose flour, 1 teaspoon granulated sugar, ½ teaspoon active dry yeast or SAF instant yeast, ¾ teaspoon kosher salt, 7 ounces (105°F to 115°F) warm water, 1 tablespoon extra virgin olive oil, semolina and all-purpose flour for dusting the pizza peel Pizza Sauce: , 1 cup pureed or crushed canned San Marzano tomatoes (or canned Italian plum tomatoes), 2-3 fresh garlic cloves grated with a microplane or pressed, 1 teaspoon extra virgin olive oil plus more for drizzling, 2-3 large pinches of kosher salt to taste, ¼ teaspoon freshly ground black pepper Toppings: , 2-3 tablespoons finely grated parmigiano-reggiano cheese plus more for serving, 7 ounces fresh mozzarella cheese (not packed in water) cut into ½-inch cubes, 5-6 large fresh basil leaves plus more for garnishing, dried red pepper flakes optional",
                Instructions: "1.Prepare Pizza Dough: In a medium bowl, whisk together the all-purpose flour, sugar, yeast and salt. Add the warm water and olive oil, and stir the mixture with a wooden spoon until the dough just begins to come together. It will seem shaggy and dry, but don’t worry.2.Scrape the dough onto a well-floured counter top and knead the dough for three minutes. It should quickly come together and begin to get sticky. Dust the dough with flour as needed (sometimes I will have to do this 2 to 3 times, depending on humidity levels) – it should be slightly tacky, but should not be sticking to your counter top.  After about 3 minutes, the dough should be smooth, slightly elastic, and tacky. Lightly grease a large mixing bowl with olive oil, and place the dough into the bowl.3. Cover the bowl with a kitchen towel (or plastic wrap) and allow the dough to rise in a warm, dry area of your kitchen for 2 hours or until the dough has doubled in size. Proofing Tip: If your kitchen is very cold, heat a large heatproof measuring cup of water in the microwave for 2 to 3 minutes. This creates a nice warm environment. Remove the cup and place the bowl with the dough in the microwave until it has risen. [If you are preparing the dough in advance, see the note section for freezing instructions.]4. Preheat Oven and Pizza Steel or Stone: Place the pizza steel (or stone) on the second to top rack of your oven (roughly 8 inches from the broiler element), and preheat the oven and steel (or stone) to 550°F (285°C) for a minumum of 1 hour. If your oven does not go up to 550°F (285°C) or you are using a delicate pizza stone, I recommend heating it to a maximum of 500°F (260°C)5. As the oven is preheating, assemble the ingredients. In a small bowl, stir together the pureed tomatoes, minced garlic, extra virgin olive oil, pepper, and salt. Set aside another small bowl with the cubed mozzarella cheese (pat the cheese with a paper towel to remove any excess moisture). Set aside the basil leaves and grated parmigiano-reggiano cheese for easy grabbing.6. Separate the dough into two equal-sized portions. It will deflate slightly, but that is OK. Place the dough on a large plate or floured counter top, cover gently with plastic wrap, and allow the dough to rest for 5 to 10 minutes.7. Assemble the Pizza: Sprinkle the pizza peel (if you do not own a pizza peel, you can try using the back of a half sheet pan - but it is tricky!) with a tablespoon of semolina and dusting of all-purpose flour. Gently use both hands to stretch one ball of pizza dough into roughly a 10-inch circle (don’t worry if its not perfectly uniform). If the dough springs back or is too elastic, allow it to rest for an additional five minutes. The edges of the dough can be slightly thicker, but make sure the center of the dough is thin (you should be able to see some light through it if you held it up). Gently transfer the dough onto the semolina and flour dusted pizza peel or baking sheet. 8. Drizzle or brush the dough lightly (using your fingertips) with olive oil (roughly a teaspoon. Using a large spoon, add roughly ½ cup of the tomato sauce onto the pizza dough, leaving a ½-inch or ¾-inch border on all sides. Use the back of the spoon to spread it evenly and thinly. Sprinkle a tablespoon of parmigiano-reggiano cheese onto the pizza sauce. Add half of the cubed mozzarella, distributing it evenly over the entire pizza. Using your hands, tear a few large basil leaves, and sprinkle the basil over the pizza. At this point, I’ll occasionally stretch the sides of the dough out a bit to make it even thinner. Gently slide the pizza from the peel onto the heated baking stone. Bake for 7 to 8 minutes, or until the crust is golden and the cheese is bubbling and caramelized and the edges of the pizza are golden brown. Note: If you're looking for more color, finish the pizza under the low or medium broil setting, but watch it carefully!the pizza peel, transfer to a wooden cutting board or foil, drizzle the top with olive oil, some grated parmigiano-reggiano cheese, and chiffonade of fresh basil. Slice and serve immediately and/or prepare the second pizza. 9. Serving Tip: If you’re serving two pizzas at once, I recommend placing the cooked pizza on a separate baking sheet while you prepare the other pizza. In the last few minutes of cooking, place the prepared pizza into the oven (on a rack below the pizza stone) so that it is extra hot for serving. Otherwise, I recommend serving one pizza fresh out of the oven, keeping the oven hot, and preparing the second pizza after people have gone through the first one! The pizza will taste great either way, but it is at its prime within minutes out of the oven!."
                },
            "c7e8f9a0-b1d2-4e3f-9a8b-c6d7e8f9a0b1": {
                _id: "c7e8f9a0-b1d2-4e3f-9a8b-c6d7e8f9a0b1",
                name: "Chocolate Chip Cookies",
                image: "data:image/jpeg;base64,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",
                description: "Classic homemade chocolate chip cookies that are soft, chewy, and loaded with chocolate chips.",
                Ingredients: "1 cup unsalted butter, softened, 1 cup granulated sugar, 1 cup packed brown sugar, 2 large eggs, 1 teaspoon vanilla extract, 3 cups all-purpose flour, 1 teaspoon baking soda, 1/2 teaspoon salt, 2 cups semisweet chocolate chips",
                Instructions: "1. Preheat the oven to 375°F (190°C). 2. In a large mixing bowl, cream together the softened butter, granulated sugar, and brown sugar until light and fluffy. 3. Beat in the eggs one at a time, then stir in the vanilla extract. 4. In a separate bowl, whisk together the flour, baking soda, and salt. Gradually add the dry ingredients to the wet ingredients, mixing until just combined. 5. Fold in the chocolate chips. 6. Drop rounded tablespoonfuls of dough onto ungreased baking sheets. 7. Bake for 9-11 minutes, or until golden brown around the edges. 8. Allow the cookies to cool on the baking sheets for a few minutes, then transfer them to wire racks to cool completely. Enjoy!"
                },
            "e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6": {
                _id: "e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
                name: "Spaghetti Bolognese",
                image: "https://images.ctfassets.net/uexfe9h31g3m/6QtnhruEFi8qgEyYAICkyS/6e36729731887703608f28e92f10cb49/Spaghetti_bolognese_4x3_V2_LOW_RES.jpg?w=2000&h=2000&fm=webp&fit=thumb&q=100",
                description: "A classic Italian pasta dish with a rich and flavorful meat sauce.",
                Ingredients: "1 lb ground beef, 1 onion, finely chopped, 2 cloves garlic, minced, 1 carrot, finely chopped, 1 celery stalk, finely chopped, 1 can (14 oz) crushed tomatoes, 1 can (6 oz) tomato paste, 1 cup beef broth, 1/2 cup red wine, 1 tsp dried basil, 1 tsp dried oregano, 1/2 tsp salt, 1/4 tsp black pepper, 1/4 tsp red pepper flakes, 1/4 cup grated Parmesan cheese, 1/4 cup chopped fresh parsley, 8 oz spaghetti",
                Instructions: "1. In a large skillet, cook the ground beef over medium heat until browned. Drain any excess fat. 2. Add the onion, garlic, carrot, and celery to the skillet. Cook until the vegetables are softened, about 5 minutes. 3. Stir in the crushed tomatoes, tomato paste, beef broth, red wine, basil, oregano, salt, black pepper, and red pepper flakes. Bring to a simmer and let cook for 20-30 minutes, stirring occasionally. 4. Meanwhile, cook the spaghetti according to package instructions. Drain and set aside. 5. Serve the spaghetti topped with the Bolognese sauce. Garnish with Parmesan cheese and fresh parsley. Enjoy!"
                },
            "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6": {
                _id: "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
                name: "Caesar Salad",
                image: "https://www.seriouseats.com/thmb/Fi_FEyVa3_-_uzfXh6OdLrzal2M=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/the-best-caesar-salad-recipe-06-40e70f549ba2489db09355abd62f79a9.jpg",
                description: "A classic salad made with crisp romaine lettuce, homemade croutons, and tangy Caesar dressing.",
                Ingredients: "1 head romaine lettuce, torn into bite-sized pieces, 1 cup croutons, 1/4 cup grated Parmesan cheese, 1/4 cup Caesar dressing, 1/4 tsp black pepper, 1/4 tsp salt, 1/4 tsp garlic powder, 1/4 tsp Worcestershire sauce, 1/4 tsp Dijon mustard, 1/4 tsp lemon juice",
                Instructions: "1. In a large bowl, combine the torn romaine lettuce, croutons, and Parmesan cheese. 2. In a separate small bowl, whisk together the Caesar dressing, black pepper, salt, garlic powder, Worcestershire sauce, Dijon mustard, and lemon juice. 3. Pour the dressing over the salad and toss to coat evenly. 4. Serve immediately and enjoy!"
                }
        }
};
var rules$1 = {
    users: {
        ".create": false,
        ".read": [
            "Owner"
        ],
        ".update": false,
        ".delete": false
    },
    members: {
        ".update": "isOwner(user, get('teams', data.teamId))",
        ".delete": "isOwner(user, get('teams', data.teamId)) || isOwner(user, data)",
        "*": {
            teamId: {
                ".update": "newData.teamId = data.teamId"
            },
            status: {
                ".create": "newData.status = 'pending'"
            }
        }
    }
};
var settings = {
    identity: identity,
    protectedData: protectedData,
    seedData: seedData,
    rules: rules$1
};

const plugins = [
    storage(settings),
    auth(settings),
    util$2(),
    rules(settings)
];

const server = http__default['default'].createServer(requestHandler(plugins, services));

const port = 3030;
server.listen(port);
console.log(`Server started on port ${port}. You can make requests to http://localhost:${port}/`);
console.log(`Admin panel located at http://localhost:${port}/admin`);

var softuniPracticeServer = {

};

return softuniPracticeServer;

})));
