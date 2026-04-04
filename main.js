import { pathToFileURL as uc, fileURLToPath as lc } from "url";
import { join as De, resolve as Re, basename as Rt, extname as dc, dirname as fc } from "path";
import ms from "electron";
import ae from "node:process";
import se from "node:path";
import { promisify as de, isDeepStrictEqual as pc } from "node:util";
import J from "node:fs";
import pt from "node:crypto";
import hc from "node:assert";
import bi from "node:os";
import "node:events";
import "node:stream";
import { existsSync as ys, readFileSync as gs, mkdirSync as vs, readdirSync as mc, statSync as yc, writeFileSync as _s } from "fs";
const { app: ct, BrowserWindow: Ri, ipcMain: Se, session: gc, safeStorage: ut, contextBridge: ap, ipcRenderer: op, shell: Ls } = ms, Xe = (e) => {
  const t = typeof e;
  return e !== null && (t === "object" || t === "function");
}, en = /* @__PURE__ */ new Set([
  "__proto__",
  "prototype",
  "constructor"
]), vc = new Set("0123456789");
function Fr(e) {
  const t = [];
  let r = "", n = "start", a = !1;
  for (const s of e)
    switch (s) {
      case "\\": {
        if (n === "index")
          throw new Error("Invalid character in an index");
        if (n === "indexEnd")
          throw new Error("Invalid character after an index");
        a && (r += s), n = "property", a = !a;
        break;
      }
      case ".": {
        if (n === "index")
          throw new Error("Invalid character in an index");
        if (n === "indexEnd") {
          n = "property";
          break;
        }
        if (a) {
          a = !1, r += s;
          break;
        }
        if (en.has(r))
          return [];
        t.push(r), r = "", n = "property";
        break;
      }
      case "[": {
        if (n === "index")
          throw new Error("Invalid character in an index");
        if (n === "indexEnd") {
          n = "index";
          break;
        }
        if (a) {
          a = !1, r += s;
          break;
        }
        if (n === "property") {
          if (en.has(r))
            return [];
          t.push(r), r = "";
        }
        n = "index";
        break;
      }
      case "]": {
        if (n === "index") {
          t.push(Number.parseInt(r, 10)), r = "", n = "indexEnd";
          break;
        }
        if (n === "indexEnd")
          throw new Error("Invalid character after an index");
      }
      default: {
        if (n === "index" && !vc.has(s))
          throw new Error("Invalid character in an index");
        if (n === "indexEnd")
          throw new Error("Invalid character after an index");
        n === "start" && (n = "property"), a && (a = !1, r += "\\"), r += s;
      }
    }
  switch (a && (r += "\\"), n) {
    case "property": {
      if (en.has(r))
        return [];
      t.push(r);
      break;
    }
    case "index":
      throw new Error("Index was not closed");
    case "start": {
      t.push("");
      break;
    }
  }
  return t;
}
function $s(e, t) {
  if (typeof t != "number" && Array.isArray(e)) {
    const r = Number.parseInt(t, 10);
    return Number.isInteger(r) && e[r] === e[t];
  }
  return !1;
}
function Pi(e, t) {
  if ($s(e, t))
    throw new Error("Cannot use string index");
}
function _c(e, t, r) {
  if (!Xe(e) || typeof t != "string")
    return r === void 0 ? e : r;
  const n = Fr(t);
  if (n.length === 0)
    return r;
  for (let a = 0; a < n.length; a++) {
    const s = n[a];
    if ($s(e, s) ? e = a === n.length - 1 ? void 0 : null : e = e[s], e == null) {
      if (a !== n.length - 1)
        return r;
      break;
    }
  }
  return e === void 0 ? r : e;
}
function Ms(e, t, r) {
  if (!Xe(e) || typeof t != "string")
    return e;
  const n = e, a = Fr(t);
  for (let s = 0; s < a.length; s++) {
    const o = a[s];
    Pi(e, o), s === a.length - 1 ? e[o] = r : Xe(e[o]) || (e[o] = typeof a[s + 1] == "number" ? [] : {}), e = e[o];
  }
  return n;
}
function $c(e, t) {
  if (!Xe(e) || typeof t != "string")
    return !1;
  const r = Fr(t);
  for (let n = 0; n < r.length; n++) {
    const a = r[n];
    if (Pi(e, a), n === r.length - 1)
      return delete e[a], !0;
    if (e = e[a], !Xe(e))
      return !1;
  }
}
function Ec(e, t) {
  if (!Xe(e) || typeof t != "string")
    return !1;
  const r = Fr(t);
  if (r.length === 0)
    return !1;
  for (const n of r) {
    if (!Xe(e) || !(n in e) || $s(e, n))
      return !1;
    e = e[n];
  }
  return !0;
}
const ze = bi.homedir(), Es = bi.tmpdir(), { env: st } = ae, wc = (e) => {
  const t = se.join(ze, "Library");
  return {
    data: se.join(t, "Application Support", e),
    config: se.join(t, "Preferences", e),
    cache: se.join(t, "Caches", e),
    log: se.join(t, "Logs", e),
    temp: se.join(Es, e)
  };
}, Sc = (e) => {
  const t = st.APPDATA || se.join(ze, "AppData", "Roaming"), r = st.LOCALAPPDATA || se.join(ze, "AppData", "Local");
  return {
    // Data/config/cache/log are invented by me as Windows isn't opinionated about this
    data: se.join(r, e, "Data"),
    config: se.join(t, e, "Config"),
    cache: se.join(r, e, "Cache"),
    log: se.join(r, e, "Log"),
    temp: se.join(Es, e)
  };
}, bc = (e) => {
  const t = se.basename(ze);
  return {
    data: se.join(st.XDG_DATA_HOME || se.join(ze, ".local", "share"), e),
    config: se.join(st.XDG_CONFIG_HOME || se.join(ze, ".config"), e),
    cache: se.join(st.XDG_CACHE_HOME || se.join(ze, ".cache"), e),
    // https://wiki.debian.org/XDGBaseDirectorySpecification#state
    log: se.join(st.XDG_STATE_HOME || se.join(ze, ".local", "state"), e),
    temp: se.join(Es, t, e)
  };
};
function Rc(e, { suffix: t = "nodejs" } = {}) {
  if (typeof e != "string")
    throw new TypeError(`Expected a string, got ${typeof e}`);
  return t && (e += `-${t}`), ae.platform === "darwin" ? wc(e) : ae.platform === "win32" ? Sc(e) : bc(e);
}
const Le = (e, t) => {
  const { onError: r } = t;
  return function(...a) {
    return e.apply(void 0, a).catch(r);
  };
}, Ae = (e, t) => {
  const { onError: r } = t;
  return function(...a) {
    try {
      return e.apply(void 0, a);
    } catch (s) {
      return r(s);
    }
  };
}, Pc = 250, Me = (e, t) => {
  const { isRetriable: r } = t;
  return function(a) {
    const { timeout: s } = a, o = a.interval ?? Pc, i = Date.now() + s;
    return function l(...u) {
      return e.apply(void 0, u).catch((c) => {
        if (!r(c) || Date.now() >= i)
          throw c;
        const y = Math.round(o * Math.random());
        return y > 0 ? new Promise((h) => setTimeout(h, y)).then(() => l.apply(void 0, u)) : l.apply(void 0, u);
      });
    };
  };
}, Ue = (e, t) => {
  const { isRetriable: r } = t;
  return function(a) {
    const { timeout: s } = a, o = Date.now() + s;
    return function(...l) {
      for (; ; )
        try {
          return e.apply(void 0, l);
        } catch (u) {
          if (!r(u) || Date.now() >= o)
            throw u;
          continue;
        }
    };
  };
}, at = {
  /* API */
  isChangeErrorOk: (e) => {
    if (!at.isNodeError(e))
      return !1;
    const { code: t } = e;
    return t === "ENOSYS" || !Ic && (t === "EINVAL" || t === "EPERM");
  },
  isNodeError: (e) => e instanceof Error,
  isRetriableError: (e) => {
    if (!at.isNodeError(e))
      return !1;
    const { code: t } = e;
    return t === "EMFILE" || t === "ENFILE" || t === "EAGAIN" || t === "EBUSY" || t === "EACCESS" || t === "EACCES" || t === "EACCS" || t === "EPERM";
  },
  onChangeError: (e) => {
    if (!at.isNodeError(e))
      throw e;
    if (!at.isChangeErrorOk(e))
      throw e;
  }
}, Pt = {
  onError: at.onChangeError
}, _e = {
  onError: () => {
  }
}, Ic = ae.getuid ? !ae.getuid() : !1, fe = {
  isRetriable: at.isRetriableError
}, pe = {
  attempt: {
    /* ASYNC */
    chmod: Le(de(J.chmod), Pt),
    chown: Le(de(J.chown), Pt),
    close: Le(de(J.close), _e),
    fsync: Le(de(J.fsync), _e),
    mkdir: Le(de(J.mkdir), _e),
    realpath: Le(de(J.realpath), _e),
    stat: Le(de(J.stat), _e),
    unlink: Le(de(J.unlink), _e),
    /* SYNC */
    chmodSync: Ae(J.chmodSync, Pt),
    chownSync: Ae(J.chownSync, Pt),
    closeSync: Ae(J.closeSync, _e),
    existsSync: Ae(J.existsSync, _e),
    fsyncSync: Ae(J.fsync, _e),
    mkdirSync: Ae(J.mkdirSync, _e),
    realpathSync: Ae(J.realpathSync, _e),
    statSync: Ae(J.statSync, _e),
    unlinkSync: Ae(J.unlinkSync, _e)
  },
  retry: {
    /* ASYNC */
    close: Me(de(J.close), fe),
    fsync: Me(de(J.fsync), fe),
    open: Me(de(J.open), fe),
    readFile: Me(de(J.readFile), fe),
    rename: Me(de(J.rename), fe),
    stat: Me(de(J.stat), fe),
    write: Me(de(J.write), fe),
    writeFile: Me(de(J.writeFile), fe),
    /* SYNC */
    closeSync: Ue(J.closeSync, fe),
    fsyncSync: Ue(J.fsyncSync, fe),
    openSync: Ue(J.openSync, fe),
    readFileSync: Ue(J.readFileSync, fe),
    renameSync: Ue(J.renameSync, fe),
    statSync: Ue(J.statSync, fe),
    writeSync: Ue(J.writeSync, fe),
    writeFileSync: Ue(J.writeFileSync, fe)
  }
}, Oc = "utf8", Us = 438, Tc = 511, Nc = {}, Ac = ae.geteuid ? ae.geteuid() : -1, jc = ae.getegid ? ae.getegid() : -1, kc = 1e3, Cc = !!ae.getuid;
ae.getuid && ae.getuid();
const Fs = 128, qc = (e) => e instanceof Error && "code" in e, Vs = (e) => typeof e == "string", tn = (e) => e === void 0, Dc = ae.platform === "linux", Ii = ae.platform === "win32", ws = ["SIGHUP", "SIGINT", "SIGTERM"];
Ii || ws.push("SIGALRM", "SIGABRT", "SIGVTALRM", "SIGXCPU", "SIGXFSZ", "SIGUSR2", "SIGTRAP", "SIGSYS", "SIGQUIT", "SIGIOT");
Dc && ws.push("SIGIO", "SIGPOLL", "SIGPWR", "SIGSTKFLT");
class Lc {
  /* CONSTRUCTOR */
  constructor() {
    this.callbacks = /* @__PURE__ */ new Set(), this.exited = !1, this.exit = (t) => {
      if (!this.exited) {
        this.exited = !0;
        for (const r of this.callbacks)
          r();
        t && (Ii && t !== "SIGINT" && t !== "SIGTERM" && t !== "SIGKILL" ? ae.kill(ae.pid, "SIGTERM") : ae.kill(ae.pid, t));
      }
    }, this.hook = () => {
      ae.once("exit", () => this.exit());
      for (const t of ws)
        try {
          ae.once(t, () => this.exit(t));
        } catch {
        }
    }, this.register = (t) => (this.callbacks.add(t), () => {
      this.callbacks.delete(t);
    }), this.hook();
  }
}
const Mc = new Lc(), Uc = Mc.register, he = {
  /* VARIABLES */
  store: {},
  // filePath => purge
  /* API */
  create: (e) => {
    const t = `000000${Math.floor(Math.random() * 16777215).toString(16)}`.slice(-6), a = `.tmp-${Date.now().toString().slice(-10)}${t}`;
    return `${e}${a}`;
  },
  get: (e, t, r = !0) => {
    const n = he.truncate(t(e));
    return n in he.store ? he.get(e, t, r) : (he.store[n] = r, [n, () => delete he.store[n]]);
  },
  purge: (e) => {
    he.store[e] && (delete he.store[e], pe.attempt.unlink(e));
  },
  purgeSync: (e) => {
    he.store[e] && (delete he.store[e], pe.attempt.unlinkSync(e));
  },
  purgeSyncAll: () => {
    for (const e in he.store)
      he.purgeSync(e);
  },
  truncate: (e) => {
    const t = se.basename(e);
    if (t.length <= Fs)
      return e;
    const r = /^(\.?)(.*?)((?:\.[^.]+)?(?:\.tmp-\d{10}[a-f0-9]{6})?)$/.exec(t);
    if (!r)
      return e;
    const n = t.length - Fs;
    return `${e.slice(0, -t.length)}${r[1]}${r[2].slice(0, -n)}${r[3]}`;
  }
};
Uc(he.purgeSyncAll);
function Oi(e, t, r = Nc) {
  if (Vs(r))
    return Oi(e, t, { encoding: r });
  const a = { timeout: r.timeout ?? kc };
  let s = null, o = null, i = null;
  try {
    const l = pe.attempt.realpathSync(e), u = !!l;
    e = l || e, [o, s] = he.get(e, r.tmpCreate || he.create, r.tmpPurge !== !1);
    const c = Cc && tn(r.chown), y = tn(r.mode);
    if (u && (c || y)) {
      const f = pe.attempt.statSync(e);
      f && (r = { ...r }, c && (r.chown = { uid: f.uid, gid: f.gid }), y && (r.mode = f.mode));
    }
    if (!u) {
      const f = se.dirname(e);
      pe.attempt.mkdirSync(f, {
        mode: Tc,
        recursive: !0
      });
    }
    i = pe.retry.openSync(a)(o, "w", r.mode || Us), r.tmpCreated && r.tmpCreated(o), Vs(t) ? pe.retry.writeSync(a)(i, t, 0, r.encoding || Oc) : tn(t) || pe.retry.writeSync(a)(i, t, 0, t.length, 0), r.fsync !== !1 && (r.fsyncWait !== !1 ? pe.retry.fsyncSync(a)(i) : pe.attempt.fsync(i)), pe.retry.closeSync(a)(i), i = null, r.chown && (r.chown.uid !== Ac || r.chown.gid !== jc) && pe.attempt.chownSync(o, r.chown.uid, r.chown.gid), r.mode && r.mode !== Us && pe.attempt.chmodSync(o, r.mode);
    try {
      pe.retry.renameSync(a)(o, e);
    } catch (f) {
      if (!qc(f) || f.code !== "ENAMETOOLONG")
        throw f;
      pe.retry.renameSync(a)(o, he.truncate(e));
    }
    s(), o = null;
  } finally {
    i && pe.attempt.closeSync(i), o && he.purge(o);
  }
}
function Ti(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var It = { exports: {} }, rn = {}, je = {}, He = {}, nn = {}, sn = {}, an = {}, zs;
function jr() {
  return zs || (zs = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.regexpCode = e.getEsmExportName = e.getProperty = e.safeStringify = e.stringify = e.strConcat = e.addCodeArg = e.str = e._ = e.nil = e._Code = e.Name = e.IDENTIFIER = e._CodeOrName = void 0;
    class t {
    }
    e._CodeOrName = t, e.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
    class r extends t {
      constructor(d) {
        if (super(), !e.IDENTIFIER.test(d))
          throw new Error("CodeGen: name must be a valid identifier");
        this.str = d;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        return !1;
      }
      get names() {
        return { [this.str]: 1 };
      }
    }
    e.Name = r;
    class n extends t {
      constructor(d) {
        super(), this._items = typeof d == "string" ? [d] : d;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        if (this._items.length > 1)
          return !1;
        const d = this._items[0];
        return d === "" || d === '""';
      }
      get str() {
        var d;
        return (d = this._str) !== null && d !== void 0 ? d : this._str = this._items.reduce((g, S) => `${g}${S}`, "");
      }
      get names() {
        var d;
        return (d = this._names) !== null && d !== void 0 ? d : this._names = this._items.reduce((g, S) => (S instanceof r && (g[S.str] = (g[S.str] || 0) + 1), g), {});
      }
    }
    e._Code = n, e.nil = new n("");
    function a(v, ...d) {
      const g = [v[0]];
      let S = 0;
      for (; S < d.length; )
        i(g, d[S]), g.push(v[++S]);
      return new n(g);
    }
    e._ = a;
    const s = new n("+");
    function o(v, ...d) {
      const g = [h(v[0])];
      let S = 0;
      for (; S < d.length; )
        g.push(s), i(g, d[S]), g.push(s, h(v[++S]));
      return l(g), new n(g);
    }
    e.str = o;
    function i(v, d) {
      d instanceof n ? v.push(...d._items) : d instanceof r ? v.push(d) : v.push(y(d));
    }
    e.addCodeArg = i;
    function l(v) {
      let d = 1;
      for (; d < v.length - 1; ) {
        if (v[d] === s) {
          const g = u(v[d - 1], v[d + 1]);
          if (g !== void 0) {
            v.splice(d - 1, 3, g);
            continue;
          }
          v[d++] = "+";
        }
        d++;
      }
    }
    function u(v, d) {
      if (d === '""')
        return v;
      if (v === '""')
        return d;
      if (typeof v == "string")
        return d instanceof r || v[v.length - 1] !== '"' ? void 0 : typeof d != "string" ? `${v.slice(0, -1)}${d}"` : d[0] === '"' ? v.slice(0, -1) + d.slice(1) : void 0;
      if (typeof d == "string" && d[0] === '"' && !(v instanceof r))
        return `"${v}${d.slice(1)}`;
    }
    function c(v, d) {
      return d.emptyStr() ? v : v.emptyStr() ? d : o`${v}${d}`;
    }
    e.strConcat = c;
    function y(v) {
      return typeof v == "number" || typeof v == "boolean" || v === null ? v : h(Array.isArray(v) ? v.join(",") : v);
    }
    function f(v) {
      return new n(h(v));
    }
    e.stringify = f;
    function h(v) {
      return JSON.stringify(v).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    }
    e.safeStringify = h;
    function $(v) {
      return typeof v == "string" && e.IDENTIFIER.test(v) ? new n(`.${v}`) : a`[${v}]`;
    }
    e.getProperty = $;
    function _(v) {
      if (typeof v == "string" && e.IDENTIFIER.test(v))
        return new n(`${v}`);
      throw new Error(`CodeGen: invalid export name: ${v}, use explicit $id name mapping`);
    }
    e.getEsmExportName = _;
    function p(v) {
      return new n(v.toString());
    }
    e.regexpCode = p;
  })(an)), an;
}
var on = {}, Gs;
function xs() {
  return Gs || (Gs = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.ValueScope = e.ValueScopeName = e.Scope = e.varKinds = e.UsedValueState = void 0;
    const t = /* @__PURE__ */ jr();
    class r extends Error {
      constructor(u) {
        super(`CodeGen: "code" for ${u} not defined`), this.value = u.value;
      }
    }
    var n;
    (function(l) {
      l[l.Started = 0] = "Started", l[l.Completed = 1] = "Completed";
    })(n || (e.UsedValueState = n = {})), e.varKinds = {
      const: new t.Name("const"),
      let: new t.Name("let"),
      var: new t.Name("var")
    };
    class a {
      constructor({ prefixes: u, parent: c } = {}) {
        this._names = {}, this._prefixes = u, this._parent = c;
      }
      toName(u) {
        return u instanceof t.Name ? u : this.name(u);
      }
      name(u) {
        return new t.Name(this._newName(u));
      }
      _newName(u) {
        const c = this._names[u] || this._nameGroup(u);
        return `${u}${c.index++}`;
      }
      _nameGroup(u) {
        var c, y;
        if (!((y = (c = this._parent) === null || c === void 0 ? void 0 : c._prefixes) === null || y === void 0) && y.has(u) || this._prefixes && !this._prefixes.has(u))
          throw new Error(`CodeGen: prefix "${u}" is not allowed in this scope`);
        return this._names[u] = { prefix: u, index: 0 };
      }
    }
    e.Scope = a;
    class s extends t.Name {
      constructor(u, c) {
        super(c), this.prefix = u;
      }
      setValue(u, { property: c, itemIndex: y }) {
        this.value = u, this.scopePath = (0, t._)`.${new t.Name(c)}[${y}]`;
      }
    }
    e.ValueScopeName = s;
    const o = (0, t._)`\n`;
    class i extends a {
      constructor(u) {
        super(u), this._values = {}, this._scope = u.scope, this.opts = { ...u, _n: u.lines ? o : t.nil };
      }
      get() {
        return this._scope;
      }
      name(u) {
        return new s(u, this._newName(u));
      }
      value(u, c) {
        var y;
        if (c.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        const f = this.toName(u), { prefix: h } = f, $ = (y = c.key) !== null && y !== void 0 ? y : c.ref;
        let _ = this._values[h];
        if (_) {
          const d = _.get($);
          if (d)
            return d;
        } else
          _ = this._values[h] = /* @__PURE__ */ new Map();
        _.set($, f);
        const p = this._scope[h] || (this._scope[h] = []), v = p.length;
        return p[v] = c.ref, f.setValue(c, { property: h, itemIndex: v }), f;
      }
      getValue(u, c) {
        const y = this._values[u];
        if (y)
          return y.get(c);
      }
      scopeRefs(u, c = this._values) {
        return this._reduceValues(c, (y) => {
          if (y.scopePath === void 0)
            throw new Error(`CodeGen: name "${y}" has no value`);
          return (0, t._)`${u}${y.scopePath}`;
        });
      }
      scopeCode(u = this._values, c, y) {
        return this._reduceValues(u, (f) => {
          if (f.value === void 0)
            throw new Error(`CodeGen: name "${f}" has no value`);
          return f.value.code;
        }, c, y);
      }
      _reduceValues(u, c, y = {}, f) {
        let h = t.nil;
        for (const $ in u) {
          const _ = u[$];
          if (!_)
            continue;
          const p = y[$] = y[$] || /* @__PURE__ */ new Map();
          _.forEach((v) => {
            if (p.has(v))
              return;
            p.set(v, n.Started);
            let d = c(v);
            if (d) {
              const g = this.opts.es5 ? e.varKinds.var : e.varKinds.const;
              h = (0, t._)`${h}${g} ${v} = ${d};${this.opts._n}`;
            } else if (d = f?.(v))
              h = (0, t._)`${h}${d}${this.opts._n}`;
            else
              throw new r(v);
            p.set(v, n.Completed);
          });
        }
        return h;
      }
    }
    e.ValueScope = i;
  })(on)), on;
}
var Ks;
function Y() {
  return Ks || (Ks = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.or = e.and = e.not = e.CodeGen = e.operators = e.varKinds = e.ValueScopeName = e.ValueScope = e.Scope = e.Name = e.regexpCode = e.stringify = e.getProperty = e.nil = e.strConcat = e.str = e._ = void 0;
    const t = /* @__PURE__ */ jr(), r = /* @__PURE__ */ xs();
    var n = /* @__PURE__ */ jr();
    Object.defineProperty(e, "_", { enumerable: !0, get: function() {
      return n._;
    } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
      return n.str;
    } }), Object.defineProperty(e, "strConcat", { enumerable: !0, get: function() {
      return n.strConcat;
    } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
      return n.nil;
    } }), Object.defineProperty(e, "getProperty", { enumerable: !0, get: function() {
      return n.getProperty;
    } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
      return n.stringify;
    } }), Object.defineProperty(e, "regexpCode", { enumerable: !0, get: function() {
      return n.regexpCode;
    } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
      return n.Name;
    } });
    var a = /* @__PURE__ */ xs();
    Object.defineProperty(e, "Scope", { enumerable: !0, get: function() {
      return a.Scope;
    } }), Object.defineProperty(e, "ValueScope", { enumerable: !0, get: function() {
      return a.ValueScope;
    } }), Object.defineProperty(e, "ValueScopeName", { enumerable: !0, get: function() {
      return a.ValueScopeName;
    } }), Object.defineProperty(e, "varKinds", { enumerable: !0, get: function() {
      return a.varKinds;
    } }), e.operators = {
      GT: new t._Code(">"),
      GTE: new t._Code(">="),
      LT: new t._Code("<"),
      LTE: new t._Code("<="),
      EQ: new t._Code("==="),
      NEQ: new t._Code("!=="),
      NOT: new t._Code("!"),
      OR: new t._Code("||"),
      AND: new t._Code("&&"),
      ADD: new t._Code("+")
    };
    class s {
      optimizeNodes() {
        return this;
      }
      optimizeNames(w, R) {
        return this;
      }
    }
    class o extends s {
      constructor(w, R, C) {
        super(), this.varKind = w, this.name = R, this.rhs = C;
      }
      render({ es5: w, _n: R }) {
        const C = w ? r.varKinds.var : this.varKind, B = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${C} ${this.name}${B};` + R;
      }
      optimizeNames(w, R) {
        if (w[this.name.str])
          return this.rhs && (this.rhs = j(this.rhs, w, R)), this;
      }
      get names() {
        return this.rhs instanceof t._CodeOrName ? this.rhs.names : {};
      }
    }
    class i extends s {
      constructor(w, R, C) {
        super(), this.lhs = w, this.rhs = R, this.sideEffects = C;
      }
      render({ _n: w }) {
        return `${this.lhs} = ${this.rhs};` + w;
      }
      optimizeNames(w, R) {
        if (!(this.lhs instanceof t.Name && !w[this.lhs.str] && !this.sideEffects))
          return this.rhs = j(this.rhs, w, R), this;
      }
      get names() {
        const w = this.lhs instanceof t.Name ? {} : { ...this.lhs.names };
        return G(w, this.rhs);
      }
    }
    class l extends i {
      constructor(w, R, C, B) {
        super(w, C, B), this.op = R;
      }
      render({ _n: w }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + w;
      }
    }
    class u extends s {
      constructor(w) {
        super(), this.label = w, this.names = {};
      }
      render({ _n: w }) {
        return `${this.label}:` + w;
      }
    }
    class c extends s {
      constructor(w) {
        super(), this.label = w, this.names = {};
      }
      render({ _n: w }) {
        return `break${this.label ? ` ${this.label}` : ""};` + w;
      }
    }
    class y extends s {
      constructor(w) {
        super(), this.error = w;
      }
      render({ _n: w }) {
        return `throw ${this.error};` + w;
      }
      get names() {
        return this.error.names;
      }
    }
    class f extends s {
      constructor(w) {
        super(), this.code = w;
      }
      render({ _n: w }) {
        return `${this.code};` + w;
      }
      optimizeNodes() {
        return `${this.code}` ? this : void 0;
      }
      optimizeNames(w, R) {
        return this.code = j(this.code, w, R), this;
      }
      get names() {
        return this.code instanceof t._CodeOrName ? this.code.names : {};
      }
    }
    class h extends s {
      constructor(w = []) {
        super(), this.nodes = w;
      }
      render(w) {
        return this.nodes.reduce((R, C) => R + C.render(w), "");
      }
      optimizeNodes() {
        const { nodes: w } = this;
        let R = w.length;
        for (; R--; ) {
          const C = w[R].optimizeNodes();
          Array.isArray(C) ? w.splice(R, 1, ...C) : C ? w[R] = C : w.splice(R, 1);
        }
        return w.length > 0 ? this : void 0;
      }
      optimizeNames(w, R) {
        const { nodes: C } = this;
        let B = C.length;
        for (; B--; ) {
          const X = C[B];
          X.optimizeNames(w, R) || (D(w, X.names), C.splice(B, 1));
        }
        return C.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((w, R) => F(w, R.names), {});
      }
    }
    class $ extends h {
      render(w) {
        return "{" + w._n + super.render(w) + "}" + w._n;
      }
    }
    class _ extends h {
    }
    class p extends $ {
    }
    p.kind = "else";
    class v extends $ {
      constructor(w, R) {
        super(R), this.condition = w;
      }
      render(w) {
        let R = `if(${this.condition})` + super.render(w);
        return this.else && (R += "else " + this.else.render(w)), R;
      }
      optimizeNodes() {
        super.optimizeNodes();
        const w = this.condition;
        if (w === !0)
          return this.nodes;
        let R = this.else;
        if (R) {
          const C = R.optimizeNodes();
          R = this.else = Array.isArray(C) ? new p(C) : C;
        }
        if (R)
          return w === !1 ? R instanceof v ? R : R.nodes : this.nodes.length ? this : new v(H(w), R instanceof v ? [R] : R.nodes);
        if (!(w === !1 || !this.nodes.length))
          return this;
      }
      optimizeNames(w, R) {
        var C;
        if (this.else = (C = this.else) === null || C === void 0 ? void 0 : C.optimizeNames(w, R), !!(super.optimizeNames(w, R) || this.else))
          return this.condition = j(this.condition, w, R), this;
      }
      get names() {
        const w = super.names;
        return G(w, this.condition), this.else && F(w, this.else.names), w;
      }
    }
    v.kind = "if";
    class d extends $ {
    }
    d.kind = "for";
    class g extends d {
      constructor(w) {
        super(), this.iteration = w;
      }
      render(w) {
        return `for(${this.iteration})` + super.render(w);
      }
      optimizeNames(w, R) {
        if (super.optimizeNames(w, R))
          return this.iteration = j(this.iteration, w, R), this;
      }
      get names() {
        return F(super.names, this.iteration.names);
      }
    }
    class S extends d {
      constructor(w, R, C, B) {
        super(), this.varKind = w, this.name = R, this.from = C, this.to = B;
      }
      render(w) {
        const R = w.es5 ? r.varKinds.var : this.varKind, { name: C, from: B, to: X } = this;
        return `for(${R} ${C}=${B}; ${C}<${X}; ${C}++)` + super.render(w);
      }
      get names() {
        const w = G(super.names, this.from);
        return G(w, this.to);
      }
    }
    class m extends d {
      constructor(w, R, C, B) {
        super(), this.loop = w, this.varKind = R, this.name = C, this.iterable = B;
      }
      render(w) {
        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(w);
      }
      optimizeNames(w, R) {
        if (super.optimizeNames(w, R))
          return this.iterable = j(this.iterable, w, R), this;
      }
      get names() {
        return F(super.names, this.iterable.names);
      }
    }
    class E extends $ {
      constructor(w, R, C) {
        super(), this.name = w, this.args = R, this.async = C;
      }
      render(w) {
        return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(w);
      }
    }
    E.kind = "func";
    class b extends h {
      render(w) {
        return "return " + super.render(w);
      }
    }
    b.kind = "return";
    class T extends $ {
      render(w) {
        let R = "try" + super.render(w);
        return this.catch && (R += this.catch.render(w)), this.finally && (R += this.finally.render(w)), R;
      }
      optimizeNodes() {
        var w, R;
        return super.optimizeNodes(), (w = this.catch) === null || w === void 0 || w.optimizeNodes(), (R = this.finally) === null || R === void 0 || R.optimizeNodes(), this;
      }
      optimizeNames(w, R) {
        var C, B;
        return super.optimizeNames(w, R), (C = this.catch) === null || C === void 0 || C.optimizeNames(w, R), (B = this.finally) === null || B === void 0 || B.optimizeNames(w, R), this;
      }
      get names() {
        const w = super.names;
        return this.catch && F(w, this.catch.names), this.finally && F(w, this.finally.names), w;
      }
    }
    class M extends $ {
      constructor(w) {
        super(), this.error = w;
      }
      render(w) {
        return `catch(${this.error})` + super.render(w);
      }
    }
    M.kind = "catch";
    class z extends $ {
      render(w) {
        return "finally" + super.render(w);
      }
    }
    z.kind = "finally";
    class q {
      constructor(w, R = {}) {
        this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...R, _n: R.lines ? `
` : "" }, this._extScope = w, this._scope = new r.Scope({ parent: w }), this._nodes = [new _()];
      }
      toString() {
        return this._root.render(this.opts);
      }
      // returns unique name in the internal scope
      name(w) {
        return this._scope.name(w);
      }
      // reserves unique name in the external scope
      scopeName(w) {
        return this._extScope.name(w);
      }
      // reserves unique name in the external scope and assigns value to it
      scopeValue(w, R) {
        const C = this._extScope.value(w, R);
        return (this._values[C.prefix] || (this._values[C.prefix] = /* @__PURE__ */ new Set())).add(C), C;
      }
      getScopeValue(w, R) {
        return this._extScope.getValue(w, R);
      }
      // return code that assigns values in the external scope to the names that are used internally
      // (same names that were returned by gen.scopeName or gen.scopeValue)
      scopeRefs(w) {
        return this._extScope.scopeRefs(w, this._values);
      }
      scopeCode() {
        return this._extScope.scopeCode(this._values);
      }
      _def(w, R, C, B) {
        const X = this._scope.toName(R);
        return C !== void 0 && B && (this._constants[X.str] = C), this._leafNode(new o(w, X, C)), X;
      }
      // `const` declaration (`var` in es5 mode)
      const(w, R, C) {
        return this._def(r.varKinds.const, w, R, C);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(w, R, C) {
        return this._def(r.varKinds.let, w, R, C);
      }
      // `var` declaration with optional assignment
      var(w, R, C) {
        return this._def(r.varKinds.var, w, R, C);
      }
      // assignment code
      assign(w, R, C) {
        return this._leafNode(new i(w, R, C));
      }
      // `+=` code
      add(w, R) {
        return this._leafNode(new l(w, e.operators.ADD, R));
      }
      // appends passed SafeExpr to code or executes Block
      code(w) {
        return typeof w == "function" ? w() : w !== t.nil && this._leafNode(new f(w)), this;
      }
      // returns code for object literal for the passed argument list of key-value pairs
      object(...w) {
        const R = ["{"];
        for (const [C, B] of w)
          R.length > 1 && R.push(","), R.push(C), (C !== B || this.opts.es5) && (R.push(":"), (0, t.addCodeArg)(R, B));
        return R.push("}"), new t._Code(R);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(w, R, C) {
        if (this._blockNode(new v(w)), R && C)
          this.code(R).else().code(C).endIf();
        else if (R)
          this.code(R).endIf();
        else if (C)
          throw new Error('CodeGen: "else" body without "then" body');
        return this;
      }
      // `else if` clause - invalid without `if` or after `else` clauses
      elseIf(w) {
        return this._elseNode(new v(w));
      }
      // `else` clause - only valid after `if` or `else if` clauses
      else() {
        return this._elseNode(new p());
      }
      // end `if` statement (needed if gen.if was used only with condition)
      endIf() {
        return this._endBlockNode(v, p);
      }
      _for(w, R) {
        return this._blockNode(w), R && this.code(R).endFor(), this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(w, R) {
        return this._for(new g(w), R);
      }
      // `for` statement for a range of values
      forRange(w, R, C, B, X = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
        const re = this._scope.toName(w);
        return this._for(new S(X, re, R, C), () => B(re));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(w, R, C, B = r.varKinds.const) {
        const X = this._scope.toName(w);
        if (this.opts.es5) {
          const re = R instanceof t.Name ? R : this.var("_arr", R);
          return this.forRange("_i", 0, (0, t._)`${re}.length`, (te) => {
            this.var(X, (0, t._)`${re}[${te}]`), C(X);
          });
        }
        return this._for(new m("of", B, X, R), () => C(X));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(w, R, C, B = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
        if (this.opts.ownProperties)
          return this.forOf(w, (0, t._)`Object.keys(${R})`, C);
        const X = this._scope.toName(w);
        return this._for(new m("in", B, X, R), () => C(X));
      }
      // end `for` loop
      endFor() {
        return this._endBlockNode(d);
      }
      // `label` statement
      label(w) {
        return this._leafNode(new u(w));
      }
      // `break` statement
      break(w) {
        return this._leafNode(new c(w));
      }
      // `return` statement
      return(w) {
        const R = new b();
        if (this._blockNode(R), this.code(w), R.nodes.length !== 1)
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(b);
      }
      // `try` statement
      try(w, R, C) {
        if (!R && !C)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const B = new T();
        if (this._blockNode(B), this.code(w), R) {
          const X = this.name("e");
          this._currNode = B.catch = new M(X), R(X);
        }
        return C && (this._currNode = B.finally = new z(), this.code(C)), this._endBlockNode(M, z);
      }
      // `throw` statement
      throw(w) {
        return this._leafNode(new y(w));
      }
      // start self-balancing block
      block(w, R) {
        return this._blockStarts.push(this._nodes.length), w && this.code(w).endBlock(R), this;
      }
      // end the current self-balancing block
      endBlock(w) {
        const R = this._blockStarts.pop();
        if (R === void 0)
          throw new Error("CodeGen: not in self-balancing block");
        const C = this._nodes.length - R;
        if (C < 0 || w !== void 0 && C !== w)
          throw new Error(`CodeGen: wrong number of nodes: ${C} vs ${w} expected`);
        return this._nodes.length = R, this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(w, R = t.nil, C, B) {
        return this._blockNode(new E(w, R, C)), B && this.code(B).endFunc(), this;
      }
      // end function definition
      endFunc() {
        return this._endBlockNode(E);
      }
      optimize(w = 1) {
        for (; w-- > 0; )
          this._root.optimizeNodes(), this._root.optimizeNames(this._root.names, this._constants);
      }
      _leafNode(w) {
        return this._currNode.nodes.push(w), this;
      }
      _blockNode(w) {
        this._currNode.nodes.push(w), this._nodes.push(w);
      }
      _endBlockNode(w, R) {
        const C = this._currNode;
        if (C instanceof w || R && C instanceof R)
          return this._nodes.pop(), this;
        throw new Error(`CodeGen: not in block "${R ? `${w.kind}/${R.kind}` : w.kind}"`);
      }
      _elseNode(w) {
        const R = this._currNode;
        if (!(R instanceof v))
          throw new Error('CodeGen: "else" without "if"');
        return this._currNode = R.else = w, this;
      }
      get _root() {
        return this._nodes[0];
      }
      get _currNode() {
        const w = this._nodes;
        return w[w.length - 1];
      }
      set _currNode(w) {
        const R = this._nodes;
        R[R.length - 1] = w;
      }
    }
    e.CodeGen = q;
    function F(I, w) {
      for (const R in w)
        I[R] = (I[R] || 0) + (w[R] || 0);
      return I;
    }
    function G(I, w) {
      return w instanceof t._CodeOrName ? F(I, w.names) : I;
    }
    function j(I, w, R) {
      if (I instanceof t.Name)
        return C(I);
      if (!B(I))
        return I;
      return new t._Code(I._items.reduce((X, re) => (re instanceof t.Name && (re = C(re)), re instanceof t._Code ? X.push(...re._items) : X.push(re), X), []));
      function C(X) {
        const re = R[X.str];
        return re === void 0 || w[X.str] !== 1 ? X : (delete w[X.str], re);
      }
      function B(X) {
        return X instanceof t._Code && X._items.some((re) => re instanceof t.Name && w[re.str] === 1 && R[re.str] !== void 0);
      }
    }
    function D(I, w) {
      for (const R in w)
        I[R] = (I[R] || 0) - (w[R] || 0);
    }
    function H(I) {
      return typeof I == "boolean" || typeof I == "number" || I === null ? !I : (0, t._)`!${A(I)}`;
    }
    e.not = H;
    const x = P(e.operators.AND);
    function V(...I) {
      return I.reduce(x);
    }
    e.and = V;
    const K = P(e.operators.OR);
    function k(...I) {
      return I.reduce(K);
    }
    e.or = k;
    function P(I) {
      return (w, R) => w === t.nil ? R : R === t.nil ? w : (0, t._)`${A(w)} ${I} ${A(R)}`;
    }
    function A(I) {
      return I instanceof t.Name ? I : (0, t._)`(${I})`;
    }
  })(sn)), sn;
}
var Q = {}, Hs;
function ee() {
  if (Hs) return Q;
  Hs = 1, Object.defineProperty(Q, "__esModule", { value: !0 }), Q.checkStrictMode = Q.getErrorPath = Q.Type = Q.useFunc = Q.setEvaluated = Q.evaluatedPropsToName = Q.mergeEvaluated = Q.eachItem = Q.unescapeJsonPointer = Q.escapeJsonPointer = Q.escapeFragment = Q.unescapeFragment = Q.schemaRefOrVal = Q.schemaHasRulesButRef = Q.schemaHasRules = Q.checkUnknownRules = Q.alwaysValidSchema = Q.toHash = void 0;
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ jr();
  function r(m) {
    const E = {};
    for (const b of m)
      E[b] = !0;
    return E;
  }
  Q.toHash = r;
  function n(m, E) {
    return typeof E == "boolean" ? E : Object.keys(E).length === 0 ? !0 : (a(m, E), !s(E, m.self.RULES.all));
  }
  Q.alwaysValidSchema = n;
  function a(m, E = m.schema) {
    const { opts: b, self: T } = m;
    if (!b.strictSchema || typeof E == "boolean")
      return;
    const M = T.RULES.keywords;
    for (const z in E)
      M[z] || S(m, `unknown keyword: "${z}"`);
  }
  Q.checkUnknownRules = a;
  function s(m, E) {
    if (typeof m == "boolean")
      return !m;
    for (const b in m)
      if (E[b])
        return !0;
    return !1;
  }
  Q.schemaHasRules = s;
  function o(m, E) {
    if (typeof m == "boolean")
      return !m;
    for (const b in m)
      if (b !== "$ref" && E.all[b])
        return !0;
    return !1;
  }
  Q.schemaHasRulesButRef = o;
  function i({ topSchemaRef: m, schemaPath: E }, b, T, M) {
    if (!M) {
      if (typeof b == "number" || typeof b == "boolean")
        return b;
      if (typeof b == "string")
        return (0, e._)`${b}`;
    }
    return (0, e._)`${m}${E}${(0, e.getProperty)(T)}`;
  }
  Q.schemaRefOrVal = i;
  function l(m) {
    return y(decodeURIComponent(m));
  }
  Q.unescapeFragment = l;
  function u(m) {
    return encodeURIComponent(c(m));
  }
  Q.escapeFragment = u;
  function c(m) {
    return typeof m == "number" ? `${m}` : m.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  Q.escapeJsonPointer = c;
  function y(m) {
    return m.replace(/~1/g, "/").replace(/~0/g, "~");
  }
  Q.unescapeJsonPointer = y;
  function f(m, E) {
    if (Array.isArray(m))
      for (const b of m)
        E(b);
    else
      E(m);
  }
  Q.eachItem = f;
  function h({ mergeNames: m, mergeToName: E, mergeValues: b, resultToName: T }) {
    return (M, z, q, F) => {
      const G = q === void 0 ? z : q instanceof e.Name ? (z instanceof e.Name ? m(M, z, q) : E(M, z, q), q) : z instanceof e.Name ? (E(M, q, z), z) : b(z, q);
      return F === e.Name && !(G instanceof e.Name) ? T(M, G) : G;
    };
  }
  Q.mergeEvaluated = {
    props: h({
      mergeNames: (m, E, b) => m.if((0, e._)`${b} !== true && ${E} !== undefined`, () => {
        m.if((0, e._)`${E} === true`, () => m.assign(b, !0), () => m.assign(b, (0, e._)`${b} || {}`).code((0, e._)`Object.assign(${b}, ${E})`));
      }),
      mergeToName: (m, E, b) => m.if((0, e._)`${b} !== true`, () => {
        E === !0 ? m.assign(b, !0) : (m.assign(b, (0, e._)`${b} || {}`), _(m, b, E));
      }),
      mergeValues: (m, E) => m === !0 ? !0 : { ...m, ...E },
      resultToName: $
    }),
    items: h({
      mergeNames: (m, E, b) => m.if((0, e._)`${b} !== true && ${E} !== undefined`, () => m.assign(b, (0, e._)`${E} === true ? true : ${b} > ${E} ? ${b} : ${E}`)),
      mergeToName: (m, E, b) => m.if((0, e._)`${b} !== true`, () => m.assign(b, E === !0 ? !0 : (0, e._)`${b} > ${E} ? ${b} : ${E}`)),
      mergeValues: (m, E) => m === !0 ? !0 : Math.max(m, E),
      resultToName: (m, E) => m.var("items", E)
    })
  };
  function $(m, E) {
    if (E === !0)
      return m.var("props", !0);
    const b = m.var("props", (0, e._)`{}`);
    return E !== void 0 && _(m, b, E), b;
  }
  Q.evaluatedPropsToName = $;
  function _(m, E, b) {
    Object.keys(b).forEach((T) => m.assign((0, e._)`${E}${(0, e.getProperty)(T)}`, !0));
  }
  Q.setEvaluated = _;
  const p = {};
  function v(m, E) {
    return m.scopeValue("func", {
      ref: E,
      code: p[E.code] || (p[E.code] = new t._Code(E.code))
    });
  }
  Q.useFunc = v;
  var d;
  (function(m) {
    m[m.Num = 0] = "Num", m[m.Str = 1] = "Str";
  })(d || (Q.Type = d = {}));
  function g(m, E, b) {
    if (m instanceof e.Name) {
      const T = E === d.Num;
      return b ? T ? (0, e._)`"[" + ${m} + "]"` : (0, e._)`"['" + ${m} + "']"` : T ? (0, e._)`"/" + ${m}` : (0, e._)`"/" + ${m}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return b ? (0, e.getProperty)(m).toString() : "/" + c(m);
  }
  Q.getErrorPath = g;
  function S(m, E, b = m.opts.strictSchema) {
    if (b) {
      if (E = `strict mode: ${E}`, b === !0)
        throw new Error(E);
      m.self.logger.warn(E);
    }
  }
  return Q.checkStrictMode = S, Q;
}
var Ot = {}, Bs;
function Pe() {
  if (Bs) return Ot;
  Bs = 1, Object.defineProperty(Ot, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Y(), t = {
    // validation function arguments
    data: new e.Name("data"),
    // data passed to validation function
    // args passed from referencing schema
    valCxt: new e.Name("valCxt"),
    // validation/data context - should not be used directly, it is destructured to the names below
    instancePath: new e.Name("instancePath"),
    parentData: new e.Name("parentData"),
    parentDataProperty: new e.Name("parentDataProperty"),
    rootData: new e.Name("rootData"),
    // root data - same as the data passed to the first/top validation function
    dynamicAnchors: new e.Name("dynamicAnchors"),
    // used to support recursiveRef and dynamicRef
    // function scoped variables
    vErrors: new e.Name("vErrors"),
    // null or array of validation errors
    errors: new e.Name("errors"),
    // counter of validation errors
    this: new e.Name("this"),
    // "globals"
    self: new e.Name("self"),
    scope: new e.Name("scope"),
    // JTD serialize/parse name for JSON string and position
    json: new e.Name("json"),
    jsonPos: new e.Name("jsonPos"),
    jsonLen: new e.Name("jsonLen"),
    jsonPart: new e.Name("jsonPart")
  };
  return Ot.default = t, Ot;
}
var Ws;
function Vr() {
  return Ws || (Ws = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.extendErrors = e.resetErrorsCount = e.reportExtraError = e.reportError = e.keyword$DataError = e.keywordError = void 0;
    const t = /* @__PURE__ */ Y(), r = /* @__PURE__ */ ee(), n = /* @__PURE__ */ Pe();
    e.keywordError = {
      message: ({ keyword: p }) => (0, t.str)`must pass "${p}" keyword validation`
    }, e.keyword$DataError = {
      message: ({ keyword: p, schemaType: v }) => v ? (0, t.str)`"${p}" keyword must be ${v} ($data)` : (0, t.str)`"${p}" keyword is invalid ($data)`
    };
    function a(p, v = e.keywordError, d, g) {
      const { it: S } = p, { gen: m, compositeRule: E, allErrors: b } = S, T = y(p, v, d);
      g ?? (E || b) ? l(m, T) : u(S, (0, t._)`[${T}]`);
    }
    e.reportError = a;
    function s(p, v = e.keywordError, d) {
      const { it: g } = p, { gen: S, compositeRule: m, allErrors: E } = g, b = y(p, v, d);
      l(S, b), m || E || u(g, n.default.vErrors);
    }
    e.reportExtraError = s;
    function o(p, v) {
      p.assign(n.default.errors, v), p.if((0, t._)`${n.default.vErrors} !== null`, () => p.if(v, () => p.assign((0, t._)`${n.default.vErrors}.length`, v), () => p.assign(n.default.vErrors, null)));
    }
    e.resetErrorsCount = o;
    function i({ gen: p, keyword: v, schemaValue: d, data: g, errsCount: S, it: m }) {
      if (S === void 0)
        throw new Error("ajv implementation error");
      const E = p.name("err");
      p.forRange("i", S, n.default.errors, (b) => {
        p.const(E, (0, t._)`${n.default.vErrors}[${b}]`), p.if((0, t._)`${E}.instancePath === undefined`, () => p.assign((0, t._)`${E}.instancePath`, (0, t.strConcat)(n.default.instancePath, m.errorPath))), p.assign((0, t._)`${E}.schemaPath`, (0, t.str)`${m.errSchemaPath}/${v}`), m.opts.verbose && (p.assign((0, t._)`${E}.schema`, d), p.assign((0, t._)`${E}.data`, g));
      });
    }
    e.extendErrors = i;
    function l(p, v) {
      const d = p.const("err", v);
      p.if((0, t._)`${n.default.vErrors} === null`, () => p.assign(n.default.vErrors, (0, t._)`[${d}]`), (0, t._)`${n.default.vErrors}.push(${d})`), p.code((0, t._)`${n.default.errors}++`);
    }
    function u(p, v) {
      const { gen: d, validateName: g, schemaEnv: S } = p;
      S.$async ? d.throw((0, t._)`new ${p.ValidationError}(${v})`) : (d.assign((0, t._)`${g}.errors`, v), d.return(!1));
    }
    const c = {
      keyword: new t.Name("keyword"),
      schemaPath: new t.Name("schemaPath"),
      // also used in JTD errors
      params: new t.Name("params"),
      propertyName: new t.Name("propertyName"),
      message: new t.Name("message"),
      schema: new t.Name("schema"),
      parentSchema: new t.Name("parentSchema")
    };
    function y(p, v, d) {
      const { createErrors: g } = p.it;
      return g === !1 ? (0, t._)`{}` : f(p, v, d);
    }
    function f(p, v, d = {}) {
      const { gen: g, it: S } = p, m = [
        h(S, d),
        $(p, d)
      ];
      return _(p, v, m), g.object(...m);
    }
    function h({ errorPath: p }, { instancePath: v }) {
      const d = v ? (0, t.str)`${p}${(0, r.getErrorPath)(v, r.Type.Str)}` : p;
      return [n.default.instancePath, (0, t.strConcat)(n.default.instancePath, d)];
    }
    function $({ keyword: p, it: { errSchemaPath: v } }, { schemaPath: d, parentSchema: g }) {
      let S = g ? v : (0, t.str)`${v}/${p}`;
      return d && (S = (0, t.str)`${S}${(0, r.getErrorPath)(d, r.Type.Str)}`), [c.schemaPath, S];
    }
    function _(p, { params: v, message: d }, g) {
      const { keyword: S, data: m, schemaValue: E, it: b } = p, { opts: T, propertyName: M, topSchemaRef: z, schemaPath: q } = b;
      g.push([c.keyword, S], [c.params, typeof v == "function" ? v(p) : v || (0, t._)`{}`]), T.messages && g.push([c.message, typeof d == "function" ? d(p) : d]), T.verbose && g.push([c.schema, E], [c.parentSchema, (0, t._)`${z}${q}`], [n.default.data, m]), M && g.push([c.propertyName, M]);
    }
  })(nn)), nn;
}
var Xs;
function Fc() {
  if (Xs) return He;
  Xs = 1, Object.defineProperty(He, "__esModule", { value: !0 }), He.boolOrEmptySchema = He.topBoolOrEmptySchema = void 0;
  const e = /* @__PURE__ */ Vr(), t = /* @__PURE__ */ Y(), r = /* @__PURE__ */ Pe(), n = {
    message: "boolean schema is false"
  };
  function a(i) {
    const { gen: l, schema: u, validateName: c } = i;
    u === !1 ? o(i, !1) : typeof u == "object" && u.$async === !0 ? l.return(r.default.data) : (l.assign((0, t._)`${c}.errors`, null), l.return(!0));
  }
  He.topBoolOrEmptySchema = a;
  function s(i, l) {
    const { gen: u, schema: c } = i;
    c === !1 ? (u.var(l, !1), o(i)) : u.var(l, !0);
  }
  He.boolOrEmptySchema = s;
  function o(i, l) {
    const { gen: u, data: c } = i, y = {
      gen: u,
      keyword: "false schema",
      data: c,
      schema: !1,
      schemaCode: !1,
      schemaValue: !1,
      params: {},
      it: i
    };
    (0, e.reportError)(y, n, void 0, l);
  }
  return He;
}
var le = {}, Be = {}, Ys;
function Ni() {
  if (Ys) return Be;
  Ys = 1, Object.defineProperty(Be, "__esModule", { value: !0 }), Be.getRules = Be.isJSONType = void 0;
  const e = ["string", "number", "integer", "boolean", "null", "object", "array"], t = new Set(e);
  function r(a) {
    return typeof a == "string" && t.has(a);
  }
  Be.isJSONType = r;
  function n() {
    const a = {
      number: { type: "number", rules: [] },
      string: { type: "string", rules: [] },
      array: { type: "array", rules: [] },
      object: { type: "object", rules: [] }
    };
    return {
      types: { ...a, integer: !0, boolean: !0, null: !0 },
      rules: [{ rules: [] }, a.number, a.string, a.array, a.object],
      post: { rules: [] },
      all: {},
      keywords: {}
    };
  }
  return Be.getRules = n, Be;
}
var ke = {}, Js;
function Ai() {
  if (Js) return ke;
  Js = 1, Object.defineProperty(ke, "__esModule", { value: !0 }), ke.shouldUseRule = ke.shouldUseGroup = ke.schemaHasRulesForType = void 0;
  function e({ schema: n, self: a }, s) {
    const o = a.RULES.types[s];
    return o && o !== !0 && t(n, o);
  }
  ke.schemaHasRulesForType = e;
  function t(n, a) {
    return a.rules.some((s) => r(n, s));
  }
  ke.shouldUseGroup = t;
  function r(n, a) {
    var s;
    return n[a.keyword] !== void 0 || ((s = a.definition.implements) === null || s === void 0 ? void 0 : s.some((o) => n[o] !== void 0));
  }
  return ke.shouldUseRule = r, ke;
}
var Qs;
function kr() {
  if (Qs) return le;
  Qs = 1, Object.defineProperty(le, "__esModule", { value: !0 }), le.reportTypeError = le.checkDataTypes = le.checkDataType = le.coerceAndCheckDataType = le.getJSONTypes = le.getSchemaTypes = le.DataType = void 0;
  const e = /* @__PURE__ */ Ni(), t = /* @__PURE__ */ Ai(), r = /* @__PURE__ */ Vr(), n = /* @__PURE__ */ Y(), a = /* @__PURE__ */ ee();
  var s;
  (function(d) {
    d[d.Correct = 0] = "Correct", d[d.Wrong = 1] = "Wrong";
  })(s || (le.DataType = s = {}));
  function o(d) {
    const g = i(d.type);
    if (g.includes("null")) {
      if (d.nullable === !1)
        throw new Error("type: null contradicts nullable: false");
    } else {
      if (!g.length && d.nullable !== void 0)
        throw new Error('"nullable" cannot be used without "type"');
      d.nullable === !0 && g.push("null");
    }
    return g;
  }
  le.getSchemaTypes = o;
  function i(d) {
    const g = Array.isArray(d) ? d : d ? [d] : [];
    if (g.every(e.isJSONType))
      return g;
    throw new Error("type must be JSONType or JSONType[]: " + g.join(","));
  }
  le.getJSONTypes = i;
  function l(d, g) {
    const { gen: S, data: m, opts: E } = d, b = c(g, E.coerceTypes), T = g.length > 0 && !(b.length === 0 && g.length === 1 && (0, t.schemaHasRulesForType)(d, g[0]));
    if (T) {
      const M = $(g, m, E.strictNumbers, s.Wrong);
      S.if(M, () => {
        b.length ? y(d, g, b) : p(d);
      });
    }
    return T;
  }
  le.coerceAndCheckDataType = l;
  const u = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
  function c(d, g) {
    return g ? d.filter((S) => u.has(S) || g === "array" && S === "array") : [];
  }
  function y(d, g, S) {
    const { gen: m, data: E, opts: b } = d, T = m.let("dataType", (0, n._)`typeof ${E}`), M = m.let("coerced", (0, n._)`undefined`);
    b.coerceTypes === "array" && m.if((0, n._)`${T} == 'object' && Array.isArray(${E}) && ${E}.length == 1`, () => m.assign(E, (0, n._)`${E}[0]`).assign(T, (0, n._)`typeof ${E}`).if($(g, E, b.strictNumbers), () => m.assign(M, E))), m.if((0, n._)`${M} !== undefined`);
    for (const q of S)
      (u.has(q) || q === "array" && b.coerceTypes === "array") && z(q);
    m.else(), p(d), m.endIf(), m.if((0, n._)`${M} !== undefined`, () => {
      m.assign(E, M), f(d, M);
    });
    function z(q) {
      switch (q) {
        case "string":
          m.elseIf((0, n._)`${T} == "number" || ${T} == "boolean"`).assign(M, (0, n._)`"" + ${E}`).elseIf((0, n._)`${E} === null`).assign(M, (0, n._)`""`);
          return;
        case "number":
          m.elseIf((0, n._)`${T} == "boolean" || ${E} === null
              || (${T} == "string" && ${E} && ${E} == +${E})`).assign(M, (0, n._)`+${E}`);
          return;
        case "integer":
          m.elseIf((0, n._)`${T} === "boolean" || ${E} === null
              || (${T} === "string" && ${E} && ${E} == +${E} && !(${E} % 1))`).assign(M, (0, n._)`+${E}`);
          return;
        case "boolean":
          m.elseIf((0, n._)`${E} === "false" || ${E} === 0 || ${E} === null`).assign(M, !1).elseIf((0, n._)`${E} === "true" || ${E} === 1`).assign(M, !0);
          return;
        case "null":
          m.elseIf((0, n._)`${E} === "" || ${E} === 0 || ${E} === false`), m.assign(M, null);
          return;
        case "array":
          m.elseIf((0, n._)`${T} === "string" || ${T} === "number"
              || ${T} === "boolean" || ${E} === null`).assign(M, (0, n._)`[${E}]`);
      }
    }
  }
  function f({ gen: d, parentData: g, parentDataProperty: S }, m) {
    d.if((0, n._)`${g} !== undefined`, () => d.assign((0, n._)`${g}[${S}]`, m));
  }
  function h(d, g, S, m = s.Correct) {
    const E = m === s.Correct ? n.operators.EQ : n.operators.NEQ;
    let b;
    switch (d) {
      case "null":
        return (0, n._)`${g} ${E} null`;
      case "array":
        b = (0, n._)`Array.isArray(${g})`;
        break;
      case "object":
        b = (0, n._)`${g} && typeof ${g} == "object" && !Array.isArray(${g})`;
        break;
      case "integer":
        b = T((0, n._)`!(${g} % 1) && !isNaN(${g})`);
        break;
      case "number":
        b = T();
        break;
      default:
        return (0, n._)`typeof ${g} ${E} ${d}`;
    }
    return m === s.Correct ? b : (0, n.not)(b);
    function T(M = n.nil) {
      return (0, n.and)((0, n._)`typeof ${g} == "number"`, M, S ? (0, n._)`isFinite(${g})` : n.nil);
    }
  }
  le.checkDataType = h;
  function $(d, g, S, m) {
    if (d.length === 1)
      return h(d[0], g, S, m);
    let E;
    const b = (0, a.toHash)(d);
    if (b.array && b.object) {
      const T = (0, n._)`typeof ${g} != "object"`;
      E = b.null ? T : (0, n._)`!${g} || ${T}`, delete b.null, delete b.array, delete b.object;
    } else
      E = n.nil;
    b.number && delete b.integer;
    for (const T in b)
      E = (0, n.and)(E, h(T, g, S, m));
    return E;
  }
  le.checkDataTypes = $;
  const _ = {
    message: ({ schema: d }) => `must be ${d}`,
    params: ({ schema: d, schemaValue: g }) => typeof d == "string" ? (0, n._)`{type: ${d}}` : (0, n._)`{type: ${g}}`
  };
  function p(d) {
    const g = v(d);
    (0, r.reportError)(g, _);
  }
  le.reportTypeError = p;
  function v(d) {
    const { gen: g, data: S, schema: m } = d, E = (0, a.schemaRefOrVal)(d, m, "type");
    return {
      gen: g,
      keyword: "type",
      data: S,
      schema: m.type,
      schemaCode: E,
      schemaValue: E,
      parentSchema: m,
      params: {},
      it: d
    };
  }
  return le;
}
var ht = {}, Zs;
function Vc() {
  if (Zs) return ht;
  Zs = 1, Object.defineProperty(ht, "__esModule", { value: !0 }), ht.assignDefaults = void 0;
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ ee();
  function r(a, s) {
    const { properties: o, items: i } = a.schema;
    if (s === "object" && o)
      for (const l in o)
        n(a, l, o[l].default);
    else s === "array" && Array.isArray(i) && i.forEach((l, u) => n(a, u, l.default));
  }
  ht.assignDefaults = r;
  function n(a, s, o) {
    const { gen: i, compositeRule: l, data: u, opts: c } = a;
    if (o === void 0)
      return;
    const y = (0, e._)`${u}${(0, e.getProperty)(s)}`;
    if (l) {
      (0, t.checkStrictMode)(a, `default is ignored for: ${y}`);
      return;
    }
    let f = (0, e._)`${y} === undefined`;
    c.useDefaults === "empty" && (f = (0, e._)`${f} || ${y} === null || ${y} === ""`), i.if(f, (0, e._)`${y} = ${(0, e.stringify)(o)}`);
  }
  return ht;
}
var be = {}, ne = {}, ea;
function Ie() {
  if (ea) return ne;
  ea = 1, Object.defineProperty(ne, "__esModule", { value: !0 }), ne.validateUnion = ne.validateArray = ne.usePattern = ne.callValidateCode = ne.schemaProperties = ne.allSchemaProperties = ne.noPropertyInData = ne.propertyInData = ne.isOwnProperty = ne.hasPropFunc = ne.reportMissingProp = ne.checkMissingProp = ne.checkReportMissingProp = void 0;
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ ee(), r = /* @__PURE__ */ Pe(), n = /* @__PURE__ */ ee();
  function a(d, g) {
    const { gen: S, data: m, it: E } = d;
    S.if(c(S, m, g, E.opts.ownProperties), () => {
      d.setParams({ missingProperty: (0, e._)`${g}` }, !0), d.error();
    });
  }
  ne.checkReportMissingProp = a;
  function s({ gen: d, data: g, it: { opts: S } }, m, E) {
    return (0, e.or)(...m.map((b) => (0, e.and)(c(d, g, b, S.ownProperties), (0, e._)`${E} = ${b}`)));
  }
  ne.checkMissingProp = s;
  function o(d, g) {
    d.setParams({ missingProperty: g }, !0), d.error();
  }
  ne.reportMissingProp = o;
  function i(d) {
    return d.scopeValue("func", {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      ref: Object.prototype.hasOwnProperty,
      code: (0, e._)`Object.prototype.hasOwnProperty`
    });
  }
  ne.hasPropFunc = i;
  function l(d, g, S) {
    return (0, e._)`${i(d)}.call(${g}, ${S})`;
  }
  ne.isOwnProperty = l;
  function u(d, g, S, m) {
    const E = (0, e._)`${g}${(0, e.getProperty)(S)} !== undefined`;
    return m ? (0, e._)`${E} && ${l(d, g, S)}` : E;
  }
  ne.propertyInData = u;
  function c(d, g, S, m) {
    const E = (0, e._)`${g}${(0, e.getProperty)(S)} === undefined`;
    return m ? (0, e.or)(E, (0, e.not)(l(d, g, S))) : E;
  }
  ne.noPropertyInData = c;
  function y(d) {
    return d ? Object.keys(d).filter((g) => g !== "__proto__") : [];
  }
  ne.allSchemaProperties = y;
  function f(d, g) {
    return y(g).filter((S) => !(0, t.alwaysValidSchema)(d, g[S]));
  }
  ne.schemaProperties = f;
  function h({ schemaCode: d, data: g, it: { gen: S, topSchemaRef: m, schemaPath: E, errorPath: b }, it: T }, M, z, q) {
    const F = q ? (0, e._)`${d}, ${g}, ${m}${E}` : g, G = [
      [r.default.instancePath, (0, e.strConcat)(r.default.instancePath, b)],
      [r.default.parentData, T.parentData],
      [r.default.parentDataProperty, T.parentDataProperty],
      [r.default.rootData, r.default.rootData]
    ];
    T.opts.dynamicRef && G.push([r.default.dynamicAnchors, r.default.dynamicAnchors]);
    const j = (0, e._)`${F}, ${S.object(...G)}`;
    return z !== e.nil ? (0, e._)`${M}.call(${z}, ${j})` : (0, e._)`${M}(${j})`;
  }
  ne.callValidateCode = h;
  const $ = (0, e._)`new RegExp`;
  function _({ gen: d, it: { opts: g } }, S) {
    const m = g.unicodeRegExp ? "u" : "", { regExp: E } = g.code, b = E(S, m);
    return d.scopeValue("pattern", {
      key: b.toString(),
      ref: b,
      code: (0, e._)`${E.code === "new RegExp" ? $ : (0, n.useFunc)(d, E)}(${S}, ${m})`
    });
  }
  ne.usePattern = _;
  function p(d) {
    const { gen: g, data: S, keyword: m, it: E } = d, b = g.name("valid");
    if (E.allErrors) {
      const M = g.let("valid", !0);
      return T(() => g.assign(M, !1)), M;
    }
    return g.var(b, !0), T(() => g.break()), b;
    function T(M) {
      const z = g.const("len", (0, e._)`${S}.length`);
      g.forRange("i", 0, z, (q) => {
        d.subschema({
          keyword: m,
          dataProp: q,
          dataPropType: t.Type.Num
        }, b), g.if((0, e.not)(b), M);
      });
    }
  }
  ne.validateArray = p;
  function v(d) {
    const { gen: g, schema: S, keyword: m, it: E } = d;
    if (!Array.isArray(S))
      throw new Error("ajv implementation error");
    if (S.some((z) => (0, t.alwaysValidSchema)(E, z)) && !E.opts.unevaluated)
      return;
    const T = g.let("valid", !1), M = g.name("_valid");
    g.block(() => S.forEach((z, q) => {
      const F = d.subschema({
        keyword: m,
        schemaProp: q,
        compositeRule: !0
      }, M);
      g.assign(T, (0, e._)`${T} || ${M}`), d.mergeValidEvaluated(F, M) || g.if((0, e.not)(T));
    })), d.result(T, () => d.reset(), () => d.error(!0));
  }
  return ne.validateUnion = v, ne;
}
var ta;
function zc() {
  if (ta) return be;
  ta = 1, Object.defineProperty(be, "__esModule", { value: !0 }), be.validateKeywordUsage = be.validSchemaType = be.funcKeywordCode = be.macroKeywordCode = void 0;
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ Pe(), r = /* @__PURE__ */ Ie(), n = /* @__PURE__ */ Vr();
  function a(f, h) {
    const { gen: $, keyword: _, schema: p, parentSchema: v, it: d } = f, g = h.macro.call(d.self, p, v, d), S = u($, _, g);
    d.opts.validateSchema !== !1 && d.self.validateSchema(g, !0);
    const m = $.name("valid");
    f.subschema({
      schema: g,
      schemaPath: e.nil,
      errSchemaPath: `${d.errSchemaPath}/${_}`,
      topSchemaRef: S,
      compositeRule: !0
    }, m), f.pass(m, () => f.error(!0));
  }
  be.macroKeywordCode = a;
  function s(f, h) {
    var $;
    const { gen: _, keyword: p, schema: v, parentSchema: d, $data: g, it: S } = f;
    l(S, h);
    const m = !g && h.compile ? h.compile.call(S.self, v, d, S) : h.validate, E = u(_, p, m), b = _.let("valid");
    f.block$data(b, T), f.ok(($ = h.valid) !== null && $ !== void 0 ? $ : b);
    function T() {
      if (h.errors === !1)
        q(), h.modifying && o(f), F(() => f.error());
      else {
        const G = h.async ? M() : z();
        h.modifying && o(f), F(() => i(f, G));
      }
    }
    function M() {
      const G = _.let("ruleErrs", null);
      return _.try(() => q((0, e._)`await `), (j) => _.assign(b, !1).if((0, e._)`${j} instanceof ${S.ValidationError}`, () => _.assign(G, (0, e._)`${j}.errors`), () => _.throw(j))), G;
    }
    function z() {
      const G = (0, e._)`${E}.errors`;
      return _.assign(G, null), q(e.nil), G;
    }
    function q(G = h.async ? (0, e._)`await ` : e.nil) {
      const j = S.opts.passContext ? t.default.this : t.default.self, D = !("compile" in h && !g || h.schema === !1);
      _.assign(b, (0, e._)`${G}${(0, r.callValidateCode)(f, E, j, D)}`, h.modifying);
    }
    function F(G) {
      var j;
      _.if((0, e.not)((j = h.valid) !== null && j !== void 0 ? j : b), G);
    }
  }
  be.funcKeywordCode = s;
  function o(f) {
    const { gen: h, data: $, it: _ } = f;
    h.if(_.parentData, () => h.assign($, (0, e._)`${_.parentData}[${_.parentDataProperty}]`));
  }
  function i(f, h) {
    const { gen: $ } = f;
    $.if((0, e._)`Array.isArray(${h})`, () => {
      $.assign(t.default.vErrors, (0, e._)`${t.default.vErrors} === null ? ${h} : ${t.default.vErrors}.concat(${h})`).assign(t.default.errors, (0, e._)`${t.default.vErrors}.length`), (0, n.extendErrors)(f);
    }, () => f.error());
  }
  function l({ schemaEnv: f }, h) {
    if (h.async && !f.$async)
      throw new Error("async keyword in sync schema");
  }
  function u(f, h, $) {
    if ($ === void 0)
      throw new Error(`keyword "${h}" failed to compile`);
    return f.scopeValue("keyword", typeof $ == "function" ? { ref: $ } : { ref: $, code: (0, e.stringify)($) });
  }
  function c(f, h, $ = !1) {
    return !h.length || h.some((_) => _ === "array" ? Array.isArray(f) : _ === "object" ? f && typeof f == "object" && !Array.isArray(f) : typeof f == _ || $ && typeof f > "u");
  }
  be.validSchemaType = c;
  function y({ schema: f, opts: h, self: $, errSchemaPath: _ }, p, v) {
    if (Array.isArray(p.keyword) ? !p.keyword.includes(v) : p.keyword !== v)
      throw new Error("ajv implementation error");
    const d = p.dependencies;
    if (d?.some((g) => !Object.prototype.hasOwnProperty.call(f, g)))
      throw new Error(`parent schema must have dependencies of ${v}: ${d.join(",")}`);
    if (p.validateSchema && !p.validateSchema(f[v])) {
      const S = `keyword "${v}" value is invalid at path "${_}": ` + $.errorsText(p.validateSchema.errors);
      if (h.validateSchema === "log")
        $.logger.error(S);
      else
        throw new Error(S);
    }
  }
  return be.validateKeywordUsage = y, be;
}
var Ce = {}, ra;
function Gc() {
  if (ra) return Ce;
  ra = 1, Object.defineProperty(Ce, "__esModule", { value: !0 }), Ce.extendSubschemaMode = Ce.extendSubschemaData = Ce.getSubschema = void 0;
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ ee();
  function r(s, { keyword: o, schemaProp: i, schema: l, schemaPath: u, errSchemaPath: c, topSchemaRef: y }) {
    if (o !== void 0 && l !== void 0)
      throw new Error('both "keyword" and "schema" passed, only one allowed');
    if (o !== void 0) {
      const f = s.schema[o];
      return i === void 0 ? {
        schema: f,
        schemaPath: (0, e._)`${s.schemaPath}${(0, e.getProperty)(o)}`,
        errSchemaPath: `${s.errSchemaPath}/${o}`
      } : {
        schema: f[i],
        schemaPath: (0, e._)`${s.schemaPath}${(0, e.getProperty)(o)}${(0, e.getProperty)(i)}`,
        errSchemaPath: `${s.errSchemaPath}/${o}/${(0, t.escapeFragment)(i)}`
      };
    }
    if (l !== void 0) {
      if (u === void 0 || c === void 0 || y === void 0)
        throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
      return {
        schema: l,
        schemaPath: u,
        topSchemaRef: y,
        errSchemaPath: c
      };
    }
    throw new Error('either "keyword" or "schema" must be passed');
  }
  Ce.getSubschema = r;
  function n(s, o, { dataProp: i, dataPropType: l, data: u, dataTypes: c, propertyName: y }) {
    if (u !== void 0 && i !== void 0)
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    const { gen: f } = o;
    if (i !== void 0) {
      const { errorPath: $, dataPathArr: _, opts: p } = o, v = f.let("data", (0, e._)`${o.data}${(0, e.getProperty)(i)}`, !0);
      h(v), s.errorPath = (0, e.str)`${$}${(0, t.getErrorPath)(i, l, p.jsPropertySyntax)}`, s.parentDataProperty = (0, e._)`${i}`, s.dataPathArr = [..._, s.parentDataProperty];
    }
    if (u !== void 0) {
      const $ = u instanceof e.Name ? u : f.let("data", u, !0);
      h($), y !== void 0 && (s.propertyName = y);
    }
    c && (s.dataTypes = c);
    function h($) {
      s.data = $, s.dataLevel = o.dataLevel + 1, s.dataTypes = [], o.definedProperties = /* @__PURE__ */ new Set(), s.parentData = o.data, s.dataNames = [...o.dataNames, $];
    }
  }
  Ce.extendSubschemaData = n;
  function a(s, { jtdDiscriminator: o, jtdMetadata: i, compositeRule: l, createErrors: u, allErrors: c }) {
    l !== void 0 && (s.compositeRule = l), u !== void 0 && (s.createErrors = u), c !== void 0 && (s.allErrors = c), s.jtdDiscriminator = o, s.jtdMetadata = i;
  }
  return Ce.extendSubschemaMode = a, Ce;
}
var me = {}, cn, na;
function ji() {
  return na || (na = 1, cn = function e(t, r) {
    if (t === r) return !0;
    if (t && r && typeof t == "object" && typeof r == "object") {
      if (t.constructor !== r.constructor) return !1;
      var n, a, s;
      if (Array.isArray(t)) {
        if (n = t.length, n != r.length) return !1;
        for (a = n; a-- !== 0; )
          if (!e(t[a], r[a])) return !1;
        return !0;
      }
      if (t.constructor === RegExp) return t.source === r.source && t.flags === r.flags;
      if (t.valueOf !== Object.prototype.valueOf) return t.valueOf() === r.valueOf();
      if (t.toString !== Object.prototype.toString) return t.toString() === r.toString();
      if (s = Object.keys(t), n = s.length, n !== Object.keys(r).length) return !1;
      for (a = n; a-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(r, s[a])) return !1;
      for (a = n; a-- !== 0; ) {
        var o = s[a];
        if (!e(t[o], r[o])) return !1;
      }
      return !0;
    }
    return t !== t && r !== r;
  }), cn;
}
var un = { exports: {} }, sa;
function xc() {
  if (sa) return un.exports;
  sa = 1;
  var e = un.exports = function(n, a, s) {
    typeof a == "function" && (s = a, a = {}), s = a.cb || s;
    var o = typeof s == "function" ? s : s.pre || function() {
    }, i = s.post || function() {
    };
    t(a, o, i, n, "", n);
  };
  e.keywords = {
    additionalItems: !0,
    items: !0,
    contains: !0,
    additionalProperties: !0,
    propertyNames: !0,
    not: !0,
    if: !0,
    then: !0,
    else: !0
  }, e.arrayKeywords = {
    items: !0,
    allOf: !0,
    anyOf: !0,
    oneOf: !0
  }, e.propsKeywords = {
    $defs: !0,
    definitions: !0,
    properties: !0,
    patternProperties: !0,
    dependencies: !0
  }, e.skipKeywords = {
    default: !0,
    enum: !0,
    const: !0,
    required: !0,
    maximum: !0,
    minimum: !0,
    exclusiveMaximum: !0,
    exclusiveMinimum: !0,
    multipleOf: !0,
    maxLength: !0,
    minLength: !0,
    pattern: !0,
    format: !0,
    maxItems: !0,
    minItems: !0,
    uniqueItems: !0,
    maxProperties: !0,
    minProperties: !0
  };
  function t(n, a, s, o, i, l, u, c, y, f) {
    if (o && typeof o == "object" && !Array.isArray(o)) {
      a(o, i, l, u, c, y, f);
      for (var h in o) {
        var $ = o[h];
        if (Array.isArray($)) {
          if (h in e.arrayKeywords)
            for (var _ = 0; _ < $.length; _++)
              t(n, a, s, $[_], i + "/" + h + "/" + _, l, i, h, o, _);
        } else if (h in e.propsKeywords) {
          if ($ && typeof $ == "object")
            for (var p in $)
              t(n, a, s, $[p], i + "/" + h + "/" + r(p), l, i, h, o, p);
        } else (h in e.keywords || n.allKeys && !(h in e.skipKeywords)) && t(n, a, s, $, i + "/" + h, l, i, h, o);
      }
      s(o, i, l, u, c, y, f);
    }
  }
  function r(n) {
    return n.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  return un.exports;
}
var aa;
function zr() {
  if (aa) return me;
  aa = 1, Object.defineProperty(me, "__esModule", { value: !0 }), me.getSchemaRefs = me.resolveUrl = me.normalizeId = me._getFullPath = me.getFullPath = me.inlineRef = void 0;
  const e = /* @__PURE__ */ ee(), t = ji(), r = xc(), n = /* @__PURE__ */ new Set([
    "type",
    "format",
    "pattern",
    "maxLength",
    "minLength",
    "maxProperties",
    "minProperties",
    "maxItems",
    "minItems",
    "maximum",
    "minimum",
    "uniqueItems",
    "multipleOf",
    "required",
    "enum",
    "const"
  ]);
  function a(_, p = !0) {
    return typeof _ == "boolean" ? !0 : p === !0 ? !o(_) : p ? i(_) <= p : !1;
  }
  me.inlineRef = a;
  const s = /* @__PURE__ */ new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor"
  ]);
  function o(_) {
    for (const p in _) {
      if (s.has(p))
        return !0;
      const v = _[p];
      if (Array.isArray(v) && v.some(o) || typeof v == "object" && o(v))
        return !0;
    }
    return !1;
  }
  function i(_) {
    let p = 0;
    for (const v in _) {
      if (v === "$ref")
        return 1 / 0;
      if (p++, !n.has(v) && (typeof _[v] == "object" && (0, e.eachItem)(_[v], (d) => p += i(d)), p === 1 / 0))
        return 1 / 0;
    }
    return p;
  }
  function l(_, p = "", v) {
    v !== !1 && (p = y(p));
    const d = _.parse(p);
    return u(_, d);
  }
  me.getFullPath = l;
  function u(_, p) {
    return _.serialize(p).split("#")[0] + "#";
  }
  me._getFullPath = u;
  const c = /#\/?$/;
  function y(_) {
    return _ ? _.replace(c, "") : "";
  }
  me.normalizeId = y;
  function f(_, p, v) {
    return v = y(v), _.resolve(p, v);
  }
  me.resolveUrl = f;
  const h = /^[a-z_][-a-z0-9._]*$/i;
  function $(_, p) {
    if (typeof _ == "boolean")
      return {};
    const { schemaId: v, uriResolver: d } = this.opts, g = y(_[v] || p), S = { "": g }, m = l(d, g, !1), E = {}, b = /* @__PURE__ */ new Set();
    return r(_, { allKeys: !0 }, (z, q, F, G) => {
      if (G === void 0)
        return;
      const j = m + q;
      let D = S[G];
      typeof z[v] == "string" && (D = H.call(this, z[v])), x.call(this, z.$anchor), x.call(this, z.$dynamicAnchor), S[q] = D;
      function H(V) {
        const K = this.opts.uriResolver.resolve;
        if (V = y(D ? K(D, V) : V), b.has(V))
          throw M(V);
        b.add(V);
        let k = this.refs[V];
        return typeof k == "string" && (k = this.refs[k]), typeof k == "object" ? T(z, k.schema, V) : V !== y(j) && (V[0] === "#" ? (T(z, E[V], V), E[V] = z) : this.refs[V] = j), V;
      }
      function x(V) {
        if (typeof V == "string") {
          if (!h.test(V))
            throw new Error(`invalid anchor "${V}"`);
          H.call(this, `#${V}`);
        }
      }
    }), E;
    function T(z, q, F) {
      if (q !== void 0 && !t(z, q))
        throw M(F);
    }
    function M(z) {
      return new Error(`reference "${z}" resolves to more than one schema`);
    }
  }
  return me.getSchemaRefs = $, me;
}
var oa;
function wt() {
  if (oa) return je;
  oa = 1, Object.defineProperty(je, "__esModule", { value: !0 }), je.getData = je.KeywordCxt = je.validateFunctionCode = void 0;
  const e = /* @__PURE__ */ Fc(), t = /* @__PURE__ */ kr(), r = /* @__PURE__ */ Ai(), n = /* @__PURE__ */ kr(), a = /* @__PURE__ */ Vc(), s = /* @__PURE__ */ zc(), o = /* @__PURE__ */ Gc(), i = /* @__PURE__ */ Y(), l = /* @__PURE__ */ Pe(), u = /* @__PURE__ */ zr(), c = /* @__PURE__ */ ee(), y = /* @__PURE__ */ Vr();
  function f(O) {
    if (m(O) && (b(O), S(O))) {
      p(O);
      return;
    }
    h(O, () => (0, e.topBoolOrEmptySchema)(O));
  }
  je.validateFunctionCode = f;
  function h({ gen: O, validateName: N, schema: L, schemaEnv: U, opts: W }, Z) {
    W.code.es5 ? O.func(N, (0, i._)`${l.default.data}, ${l.default.valCxt}`, U.$async, () => {
      O.code((0, i._)`"use strict"; ${d(L, W)}`), _(O, W), O.code(Z);
    }) : O.func(N, (0, i._)`${l.default.data}, ${$(W)}`, U.$async, () => O.code(d(L, W)).code(Z));
  }
  function $(O) {
    return (0, i._)`{${l.default.instancePath}="", ${l.default.parentData}, ${l.default.parentDataProperty}, ${l.default.rootData}=${l.default.data}${O.dynamicRef ? (0, i._)`, ${l.default.dynamicAnchors}={}` : i.nil}}={}`;
  }
  function _(O, N) {
    O.if(l.default.valCxt, () => {
      O.var(l.default.instancePath, (0, i._)`${l.default.valCxt}.${l.default.instancePath}`), O.var(l.default.parentData, (0, i._)`${l.default.valCxt}.${l.default.parentData}`), O.var(l.default.parentDataProperty, (0, i._)`${l.default.valCxt}.${l.default.parentDataProperty}`), O.var(l.default.rootData, (0, i._)`${l.default.valCxt}.${l.default.rootData}`), N.dynamicRef && O.var(l.default.dynamicAnchors, (0, i._)`${l.default.valCxt}.${l.default.dynamicAnchors}`);
    }, () => {
      O.var(l.default.instancePath, (0, i._)`""`), O.var(l.default.parentData, (0, i._)`undefined`), O.var(l.default.parentDataProperty, (0, i._)`undefined`), O.var(l.default.rootData, l.default.data), N.dynamicRef && O.var(l.default.dynamicAnchors, (0, i._)`{}`);
    });
  }
  function p(O) {
    const { schema: N, opts: L, gen: U } = O;
    h(O, () => {
      L.$comment && N.$comment && G(O), z(O), U.let(l.default.vErrors, null), U.let(l.default.errors, 0), L.unevaluated && v(O), T(O), j(O);
    });
  }
  function v(O) {
    const { gen: N, validateName: L } = O;
    O.evaluated = N.const("evaluated", (0, i._)`${L}.evaluated`), N.if((0, i._)`${O.evaluated}.dynamicProps`, () => N.assign((0, i._)`${O.evaluated}.props`, (0, i._)`undefined`)), N.if((0, i._)`${O.evaluated}.dynamicItems`, () => N.assign((0, i._)`${O.evaluated}.items`, (0, i._)`undefined`));
  }
  function d(O, N) {
    const L = typeof O == "object" && O[N.schemaId];
    return L && (N.code.source || N.code.process) ? (0, i._)`/*# sourceURL=${L} */` : i.nil;
  }
  function g(O, N) {
    if (m(O) && (b(O), S(O))) {
      E(O, N);
      return;
    }
    (0, e.boolOrEmptySchema)(O, N);
  }
  function S({ schema: O, self: N }) {
    if (typeof O == "boolean")
      return !O;
    for (const L in O)
      if (N.RULES.all[L])
        return !0;
    return !1;
  }
  function m(O) {
    return typeof O.schema != "boolean";
  }
  function E(O, N) {
    const { schema: L, gen: U, opts: W } = O;
    W.$comment && L.$comment && G(O), q(O), F(O);
    const Z = U.const("_errs", l.default.errors);
    T(O, Z), U.var(N, (0, i._)`${Z} === ${l.default.errors}`);
  }
  function b(O) {
    (0, c.checkUnknownRules)(O), M(O);
  }
  function T(O, N) {
    if (O.opts.jtd)
      return H(O, [], !1, N);
    const L = (0, t.getSchemaTypes)(O.schema), U = (0, t.coerceAndCheckDataType)(O, L);
    H(O, L, !U, N);
  }
  function M(O) {
    const { schema: N, errSchemaPath: L, opts: U, self: W } = O;
    N.$ref && U.ignoreKeywordsWithRef && (0, c.schemaHasRulesButRef)(N, W.RULES) && W.logger.warn(`$ref: keywords ignored in schema at path "${L}"`);
  }
  function z(O) {
    const { schema: N, opts: L } = O;
    N.default !== void 0 && L.useDefaults && L.strictSchema && (0, c.checkStrictMode)(O, "default is ignored in the schema root");
  }
  function q(O) {
    const N = O.schema[O.opts.schemaId];
    N && (O.baseId = (0, u.resolveUrl)(O.opts.uriResolver, O.baseId, N));
  }
  function F(O) {
    if (O.schema.$async && !O.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function G({ gen: O, schemaEnv: N, schema: L, errSchemaPath: U, opts: W }) {
    const Z = L.$comment;
    if (W.$comment === !0)
      O.code((0, i._)`${l.default.self}.logger.log(${Z})`);
    else if (typeof W.$comment == "function") {
      const ce = (0, i.str)`${U}/$comment`, we = O.scopeValue("root", { ref: N.root });
      O.code((0, i._)`${l.default.self}.opts.$comment(${Z}, ${ce}, ${we}.schema)`);
    }
  }
  function j(O) {
    const { gen: N, schemaEnv: L, validateName: U, ValidationError: W, opts: Z } = O;
    L.$async ? N.if((0, i._)`${l.default.errors} === 0`, () => N.return(l.default.data), () => N.throw((0, i._)`new ${W}(${l.default.vErrors})`)) : (N.assign((0, i._)`${U}.errors`, l.default.vErrors), Z.unevaluated && D(O), N.return((0, i._)`${l.default.errors} === 0`));
  }
  function D({ gen: O, evaluated: N, props: L, items: U }) {
    L instanceof i.Name && O.assign((0, i._)`${N}.props`, L), U instanceof i.Name && O.assign((0, i._)`${N}.items`, U);
  }
  function H(O, N, L, U) {
    const { gen: W, schema: Z, data: ce, allErrors: we, opts: ge, self: ve } = O, { RULES: ue } = ve;
    if (Z.$ref && (ge.ignoreKeywordsWithRef || !(0, c.schemaHasRulesButRef)(Z, ue))) {
      W.block(() => B(O, "$ref", ue.all.$ref.definition));
      return;
    }
    ge.jtd || V(O, N), W.block(() => {
      for (const Ee of ue.rules)
        Ye(Ee);
      Ye(ue.post);
    });
    function Ye(Ee) {
      (0, r.shouldUseGroup)(Z, Ee) && (Ee.type ? (W.if((0, n.checkDataType)(Ee.type, ce, ge.strictNumbers)), x(O, Ee), N.length === 1 && N[0] === Ee.type && L && (W.else(), (0, n.reportTypeError)(O)), W.endIf()) : x(O, Ee), we || W.if((0, i._)`${l.default.errors} === ${U || 0}`));
    }
  }
  function x(O, N) {
    const { gen: L, schema: U, opts: { useDefaults: W } } = O;
    W && (0, a.assignDefaults)(O, N.type), L.block(() => {
      for (const Z of N.rules)
        (0, r.shouldUseRule)(U, Z) && B(O, Z.keyword, Z.definition, N.type);
    });
  }
  function V(O, N) {
    O.schemaEnv.meta || !O.opts.strictTypes || (K(O, N), O.opts.allowUnionTypes || k(O, N), P(O, O.dataTypes));
  }
  function K(O, N) {
    if (N.length) {
      if (!O.dataTypes.length) {
        O.dataTypes = N;
        return;
      }
      N.forEach((L) => {
        I(O.dataTypes, L) || R(O, `type "${L}" not allowed by context "${O.dataTypes.join(",")}"`);
      }), w(O, N);
    }
  }
  function k(O, N) {
    N.length > 1 && !(N.length === 2 && N.includes("null")) && R(O, "use allowUnionTypes to allow union type keyword");
  }
  function P(O, N) {
    const L = O.self.RULES.all;
    for (const U in L) {
      const W = L[U];
      if (typeof W == "object" && (0, r.shouldUseRule)(O.schema, W)) {
        const { type: Z } = W.definition;
        Z.length && !Z.some((ce) => A(N, ce)) && R(O, `missing type "${Z.join(",")}" for keyword "${U}"`);
      }
    }
  }
  function A(O, N) {
    return O.includes(N) || N === "number" && O.includes("integer");
  }
  function I(O, N) {
    return O.includes(N) || N === "integer" && O.includes("number");
  }
  function w(O, N) {
    const L = [];
    for (const U of O.dataTypes)
      I(N, U) ? L.push(U) : N.includes("integer") && U === "number" && L.push("integer");
    O.dataTypes = L;
  }
  function R(O, N) {
    const L = O.schemaEnv.baseId + O.errSchemaPath;
    N += ` at "${L}" (strictTypes)`, (0, c.checkStrictMode)(O, N, O.opts.strictTypes);
  }
  class C {
    constructor(N, L, U) {
      if ((0, s.validateKeywordUsage)(N, L, U), this.gen = N.gen, this.allErrors = N.allErrors, this.keyword = U, this.data = N.data, this.schema = N.schema[U], this.$data = L.$data && N.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, c.schemaRefOrVal)(N, this.schema, U, this.$data), this.schemaType = L.schemaType, this.parentSchema = N.schema, this.params = {}, this.it = N, this.def = L, this.$data)
        this.schemaCode = N.gen.const("vSchema", te(this.$data, N));
      else if (this.schemaCode = this.schemaValue, !(0, s.validSchemaType)(this.schema, L.schemaType, L.allowUndefined))
        throw new Error(`${U} value must be ${JSON.stringify(L.schemaType)}`);
      ("code" in L ? L.trackErrors : L.errors !== !1) && (this.errsCount = N.gen.const("_errs", l.default.errors));
    }
    result(N, L, U) {
      this.failResult((0, i.not)(N), L, U);
    }
    failResult(N, L, U) {
      this.gen.if(N), U ? U() : this.error(), L ? (this.gen.else(), L(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    pass(N, L) {
      this.failResult((0, i.not)(N), void 0, L);
    }
    fail(N) {
      if (N === void 0) {
        this.error(), this.allErrors || this.gen.if(!1);
        return;
      }
      this.gen.if(N), this.error(), this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    fail$data(N) {
      if (!this.$data)
        return this.fail(N);
      const { schemaCode: L } = this;
      this.fail((0, i._)`${L} !== undefined && (${(0, i.or)(this.invalid$data(), N)})`);
    }
    error(N, L, U) {
      if (L) {
        this.setParams(L), this._error(N, U), this.setParams({});
        return;
      }
      this._error(N, U);
    }
    _error(N, L) {
      (N ? y.reportExtraError : y.reportError)(this, this.def.error, L);
    }
    $dataError() {
      (0, y.reportError)(this, this.def.$dataError || y.keyword$DataError);
    }
    reset() {
      if (this.errsCount === void 0)
        throw new Error('add "trackErrors" to keyword definition');
      (0, y.resetErrorsCount)(this.gen, this.errsCount);
    }
    ok(N) {
      this.allErrors || this.gen.if(N);
    }
    setParams(N, L) {
      L ? Object.assign(this.params, N) : this.params = N;
    }
    block$data(N, L, U = i.nil) {
      this.gen.block(() => {
        this.check$data(N, U), L();
      });
    }
    check$data(N = i.nil, L = i.nil) {
      if (!this.$data)
        return;
      const { gen: U, schemaCode: W, schemaType: Z, def: ce } = this;
      U.if((0, i.or)((0, i._)`${W} === undefined`, L)), N !== i.nil && U.assign(N, !0), (Z.length || ce.validateSchema) && (U.elseIf(this.invalid$data()), this.$dataError(), N !== i.nil && U.assign(N, !1)), U.else();
    }
    invalid$data() {
      const { gen: N, schemaCode: L, schemaType: U, def: W, it: Z } = this;
      return (0, i.or)(ce(), we());
      function ce() {
        if (U.length) {
          if (!(L instanceof i.Name))
            throw new Error("ajv implementation error");
          const ge = Array.isArray(U) ? U : [U];
          return (0, i._)`${(0, n.checkDataTypes)(ge, L, Z.opts.strictNumbers, n.DataType.Wrong)}`;
        }
        return i.nil;
      }
      function we() {
        if (W.validateSchema) {
          const ge = N.scopeValue("validate$data", { ref: W.validateSchema });
          return (0, i._)`!${ge}(${L})`;
        }
        return i.nil;
      }
    }
    subschema(N, L) {
      const U = (0, o.getSubschema)(this.it, N);
      (0, o.extendSubschemaData)(U, this.it, N), (0, o.extendSubschemaMode)(U, N);
      const W = { ...this.it, ...U, items: void 0, props: void 0 };
      return g(W, L), W;
    }
    mergeEvaluated(N, L) {
      const { it: U, gen: W } = this;
      U.opts.unevaluated && (U.props !== !0 && N.props !== void 0 && (U.props = c.mergeEvaluated.props(W, N.props, U.props, L)), U.items !== !0 && N.items !== void 0 && (U.items = c.mergeEvaluated.items(W, N.items, U.items, L)));
    }
    mergeValidEvaluated(N, L) {
      const { it: U, gen: W } = this;
      if (U.opts.unevaluated && (U.props !== !0 || U.items !== !0))
        return W.if(L, () => this.mergeEvaluated(N, i.Name)), !0;
    }
  }
  je.KeywordCxt = C;
  function B(O, N, L, U) {
    const W = new C(O, L, N);
    "code" in L ? L.code(W, U) : W.$data && L.validate ? (0, s.funcKeywordCode)(W, L) : "macro" in L ? (0, s.macroKeywordCode)(W, L) : (L.compile || L.validate) && (0, s.funcKeywordCode)(W, L);
  }
  const X = /^\/(?:[^~]|~0|~1)*$/, re = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function te(O, { dataLevel: N, dataNames: L, dataPathArr: U }) {
    let W, Z;
    if (O === "")
      return l.default.rootData;
    if (O[0] === "/") {
      if (!X.test(O))
        throw new Error(`Invalid JSON-pointer: ${O}`);
      W = O, Z = l.default.rootData;
    } else {
      const ve = re.exec(O);
      if (!ve)
        throw new Error(`Invalid JSON-pointer: ${O}`);
      const ue = +ve[1];
      if (W = ve[2], W === "#") {
        if (ue >= N)
          throw new Error(ge("property/index", ue));
        return U[N - ue];
      }
      if (ue > N)
        throw new Error(ge("data", ue));
      if (Z = L[N - ue], !W)
        return Z;
    }
    let ce = Z;
    const we = W.split("/");
    for (const ve of we)
      ve && (Z = (0, i._)`${Z}${(0, i.getProperty)((0, c.unescapeJsonPointer)(ve))}`, ce = (0, i._)`${ce} && ${Z}`);
    return ce;
    function ge(ve, ue) {
      return `Cannot access ${ve} ${ue} levels up, current level is ${N}`;
    }
  }
  return je.getData = te, je;
}
var Tt = {}, ia;
function Gr() {
  if (ia) return Tt;
  ia = 1, Object.defineProperty(Tt, "__esModule", { value: !0 });
  class e extends Error {
    constructor(r) {
      super("validation failed"), this.errors = r, this.ajv = this.validation = !0;
    }
  }
  return Tt.default = e, Tt;
}
var Nt = {}, ca;
function St() {
  if (ca) return Nt;
  ca = 1, Object.defineProperty(Nt, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ zr();
  class t extends Error {
    constructor(n, a, s, o) {
      super(o || `can't resolve reference ${s} from id ${a}`), this.missingRef = (0, e.resolveUrl)(n, a, s), this.missingSchema = (0, e.normalizeId)((0, e.getFullPath)(n, this.missingRef));
    }
  }
  return Nt.default = t, Nt;
}
var $e = {}, ua;
function xr() {
  if (ua) return $e;
  ua = 1, Object.defineProperty($e, "__esModule", { value: !0 }), $e.resolveSchema = $e.getCompilingSchema = $e.resolveRef = $e.compileSchema = $e.SchemaEnv = void 0;
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ Gr(), r = /* @__PURE__ */ Pe(), n = /* @__PURE__ */ zr(), a = /* @__PURE__ */ ee(), s = /* @__PURE__ */ wt();
  class o {
    constructor(v) {
      var d;
      this.refs = {}, this.dynamicAnchors = {};
      let g;
      typeof v.schema == "object" && (g = v.schema), this.schema = v.schema, this.schemaId = v.schemaId, this.root = v.root || this, this.baseId = (d = v.baseId) !== null && d !== void 0 ? d : (0, n.normalizeId)(g?.[v.schemaId || "$id"]), this.schemaPath = v.schemaPath, this.localRefs = v.localRefs, this.meta = v.meta, this.$async = g?.$async, this.refs = {};
    }
  }
  $e.SchemaEnv = o;
  function i(p) {
    const v = c.call(this, p);
    if (v)
      return v;
    const d = (0, n.getFullPath)(this.opts.uriResolver, p.root.baseId), { es5: g, lines: S } = this.opts.code, { ownProperties: m } = this.opts, E = new e.CodeGen(this.scope, { es5: g, lines: S, ownProperties: m });
    let b;
    p.$async && (b = E.scopeValue("Error", {
      ref: t.default,
      code: (0, e._)`require("ajv/dist/runtime/validation_error").default`
    }));
    const T = E.scopeName("validate");
    p.validateName = T;
    const M = {
      gen: E,
      allErrors: this.opts.allErrors,
      data: r.default.data,
      parentData: r.default.parentData,
      parentDataProperty: r.default.parentDataProperty,
      dataNames: [r.default.data],
      dataPathArr: [e.nil],
      // TODO can its length be used as dataLevel if nil is removed?
      dataLevel: 0,
      dataTypes: [],
      definedProperties: /* @__PURE__ */ new Set(),
      topSchemaRef: E.scopeValue("schema", this.opts.code.source === !0 ? { ref: p.schema, code: (0, e.stringify)(p.schema) } : { ref: p.schema }),
      validateName: T,
      ValidationError: b,
      schema: p.schema,
      schemaEnv: p,
      rootId: d,
      baseId: p.baseId || d,
      schemaPath: e.nil,
      errSchemaPath: p.schemaPath || (this.opts.jtd ? "" : "#"),
      errorPath: (0, e._)`""`,
      opts: this.opts,
      self: this
    };
    let z;
    try {
      this._compilations.add(p), (0, s.validateFunctionCode)(M), E.optimize(this.opts.code.optimize);
      const q = E.toString();
      z = `${E.scopeRefs(r.default.scope)}return ${q}`, this.opts.code.process && (z = this.opts.code.process(z, p));
      const G = new Function(`${r.default.self}`, `${r.default.scope}`, z)(this, this.scope.get());
      if (this.scope.value(T, { ref: G }), G.errors = null, G.schema = p.schema, G.schemaEnv = p, p.$async && (G.$async = !0), this.opts.code.source === !0 && (G.source = { validateName: T, validateCode: q, scopeValues: E._values }), this.opts.unevaluated) {
        const { props: j, items: D } = M;
        G.evaluated = {
          props: j instanceof e.Name ? void 0 : j,
          items: D instanceof e.Name ? void 0 : D,
          dynamicProps: j instanceof e.Name,
          dynamicItems: D instanceof e.Name
        }, G.source && (G.source.evaluated = (0, e.stringify)(G.evaluated));
      }
      return p.validate = G, p;
    } catch (q) {
      throw delete p.validate, delete p.validateName, z && this.logger.error("Error compiling schema, function code:", z), q;
    } finally {
      this._compilations.delete(p);
    }
  }
  $e.compileSchema = i;
  function l(p, v, d) {
    var g;
    d = (0, n.resolveUrl)(this.opts.uriResolver, v, d);
    const S = p.refs[d];
    if (S)
      return S;
    let m = f.call(this, p, d);
    if (m === void 0) {
      const E = (g = p.localRefs) === null || g === void 0 ? void 0 : g[d], { schemaId: b } = this.opts;
      E && (m = new o({ schema: E, schemaId: b, root: p, baseId: v }));
    }
    if (m !== void 0)
      return p.refs[d] = u.call(this, m);
  }
  $e.resolveRef = l;
  function u(p) {
    return (0, n.inlineRef)(p.schema, this.opts.inlineRefs) ? p.schema : p.validate ? p : i.call(this, p);
  }
  function c(p) {
    for (const v of this._compilations)
      if (y(v, p))
        return v;
  }
  $e.getCompilingSchema = c;
  function y(p, v) {
    return p.schema === v.schema && p.root === v.root && p.baseId === v.baseId;
  }
  function f(p, v) {
    let d;
    for (; typeof (d = this.refs[v]) == "string"; )
      v = d;
    return d || this.schemas[v] || h.call(this, p, v);
  }
  function h(p, v) {
    const d = this.opts.uriResolver.parse(v), g = (0, n._getFullPath)(this.opts.uriResolver, d);
    let S = (0, n.getFullPath)(this.opts.uriResolver, p.baseId, void 0);
    if (Object.keys(p.schema).length > 0 && g === S)
      return _.call(this, d, p);
    const m = (0, n.normalizeId)(g), E = this.refs[m] || this.schemas[m];
    if (typeof E == "string") {
      const b = h.call(this, p, E);
      return typeof b?.schema != "object" ? void 0 : _.call(this, d, b);
    }
    if (typeof E?.schema == "object") {
      if (E.validate || i.call(this, E), m === (0, n.normalizeId)(v)) {
        const { schema: b } = E, { schemaId: T } = this.opts, M = b[T];
        return M && (S = (0, n.resolveUrl)(this.opts.uriResolver, S, M)), new o({ schema: b, schemaId: T, root: p, baseId: S });
      }
      return _.call(this, d, E);
    }
  }
  $e.resolveSchema = h;
  const $ = /* @__PURE__ */ new Set([
    "properties",
    "patternProperties",
    "enum",
    "dependencies",
    "definitions"
  ]);
  function _(p, { baseId: v, schema: d, root: g }) {
    var S;
    if (((S = p.fragment) === null || S === void 0 ? void 0 : S[0]) !== "/")
      return;
    for (const b of p.fragment.slice(1).split("/")) {
      if (typeof d == "boolean")
        return;
      const T = d[(0, a.unescapeFragment)(b)];
      if (T === void 0)
        return;
      d = T;
      const M = typeof d == "object" && d[this.opts.schemaId];
      !$.has(b) && M && (v = (0, n.resolveUrl)(this.opts.uriResolver, v, M));
    }
    let m;
    if (typeof d != "boolean" && d.$ref && !(0, a.schemaHasRulesButRef)(d, this.RULES)) {
      const b = (0, n.resolveUrl)(this.opts.uriResolver, v, d.$ref);
      m = h.call(this, g, b);
    }
    const { schemaId: E } = this.opts;
    if (m = m || new o({ schema: d, schemaId: E, root: g, baseId: v }), m.schema !== m.root.schema)
      return m;
  }
  return $e;
}
const Kc = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#", Hc = "Meta-schema for $data reference (JSON AnySchema extension proposal)", Bc = "object", Wc = ["$data"], Xc = { $data: { type: "string", anyOf: [{ format: "relative-json-pointer" }, { format: "json-pointer" }] } }, Yc = !1, Jc = {
  $id: Kc,
  description: Hc,
  type: Bc,
  required: Wc,
  properties: Xc,
  additionalProperties: Yc
};
var At = {}, mt = { exports: {} }, ln, la;
function ki() {
  if (la) return ln;
  la = 1;
  const e = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu), t = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
  function r(f) {
    let h = "", $ = 0, _ = 0;
    for (_ = 0; _ < f.length; _++)
      if ($ = f[_].charCodeAt(0), $ !== 48) {
        if (!($ >= 48 && $ <= 57 || $ >= 65 && $ <= 70 || $ >= 97 && $ <= 102))
          return "";
        h += f[_];
        break;
      }
    for (_ += 1; _ < f.length; _++) {
      if ($ = f[_].charCodeAt(0), !($ >= 48 && $ <= 57 || $ >= 65 && $ <= 70 || $ >= 97 && $ <= 102))
        return "";
      h += f[_];
    }
    return h;
  }
  const n = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
  function a(f) {
    return f.length = 0, !0;
  }
  function s(f, h, $) {
    if (f.length) {
      const _ = r(f);
      if (_ !== "")
        h.push(_);
      else
        return $.error = !0, !1;
      f.length = 0;
    }
    return !0;
  }
  function o(f) {
    let h = 0;
    const $ = { error: !1, address: "", zone: "" }, _ = [], p = [];
    let v = !1, d = !1, g = s;
    for (let S = 0; S < f.length; S++) {
      const m = f[S];
      if (!(m === "[" || m === "]"))
        if (m === ":") {
          if (v === !0 && (d = !0), !g(p, _, $))
            break;
          if (++h > 7) {
            $.error = !0;
            break;
          }
          S > 0 && f[S - 1] === ":" && (v = !0), _.push(":");
          continue;
        } else if (m === "%") {
          if (!g(p, _, $))
            break;
          g = a;
        } else {
          p.push(m);
          continue;
        }
    }
    return p.length && (g === a ? $.zone = p.join("") : d ? _.push(p.join("")) : _.push(r(p))), $.address = _.join(""), $;
  }
  function i(f) {
    if (l(f, ":") < 2)
      return { host: f, isIPV6: !1 };
    const h = o(f);
    if (h.error)
      return { host: f, isIPV6: !1 };
    {
      let $ = h.address, _ = h.address;
      return h.zone && ($ += "%" + h.zone, _ += "%25" + h.zone), { host: $, isIPV6: !0, escapedHost: _ };
    }
  }
  function l(f, h) {
    let $ = 0;
    for (let _ = 0; _ < f.length; _++)
      f[_] === h && $++;
    return $;
  }
  function u(f) {
    let h = f;
    const $ = [];
    let _ = -1, p = 0;
    for (; p = h.length; ) {
      if (p === 1) {
        if (h === ".")
          break;
        if (h === "/") {
          $.push("/");
          break;
        } else {
          $.push(h);
          break;
        }
      } else if (p === 2) {
        if (h[0] === ".") {
          if (h[1] === ".")
            break;
          if (h[1] === "/") {
            h = h.slice(2);
            continue;
          }
        } else if (h[0] === "/" && (h[1] === "." || h[1] === "/")) {
          $.push("/");
          break;
        }
      } else if (p === 3 && h === "/..") {
        $.length !== 0 && $.pop(), $.push("/");
        break;
      }
      if (h[0] === ".") {
        if (h[1] === ".") {
          if (h[2] === "/") {
            h = h.slice(3);
            continue;
          }
        } else if (h[1] === "/") {
          h = h.slice(2);
          continue;
        }
      } else if (h[0] === "/" && h[1] === ".") {
        if (h[2] === "/") {
          h = h.slice(2);
          continue;
        } else if (h[2] === "." && h[3] === "/") {
          h = h.slice(3), $.length !== 0 && $.pop();
          continue;
        }
      }
      if ((_ = h.indexOf("/", 1)) === -1) {
        $.push(h);
        break;
      } else
        $.push(h.slice(0, _)), h = h.slice(_);
    }
    return $.join("");
  }
  function c(f, h) {
    const $ = h !== !0 ? escape : unescape;
    return f.scheme !== void 0 && (f.scheme = $(f.scheme)), f.userinfo !== void 0 && (f.userinfo = $(f.userinfo)), f.host !== void 0 && (f.host = $(f.host)), f.path !== void 0 && (f.path = $(f.path)), f.query !== void 0 && (f.query = $(f.query)), f.fragment !== void 0 && (f.fragment = $(f.fragment)), f;
  }
  function y(f) {
    const h = [];
    if (f.userinfo !== void 0 && (h.push(f.userinfo), h.push("@")), f.host !== void 0) {
      let $ = unescape(f.host);
      if (!t($)) {
        const _ = i($);
        _.isIPV6 === !0 ? $ = `[${_.escapedHost}]` : $ = f.host;
      }
      h.push($);
    }
    return (typeof f.port == "number" || typeof f.port == "string") && (h.push(":"), h.push(String(f.port))), h.length ? h.join("") : void 0;
  }
  return ln = {
    nonSimpleDomain: n,
    recomposeAuthority: y,
    normalizeComponentEncoding: c,
    removeDotSegments: u,
    isIPv4: t,
    isUUID: e,
    normalizeIPv6: i,
    stringArrayToHexStripped: r
  }, ln;
}
var dn, da;
function Qc() {
  if (da) return dn;
  da = 1;
  const { isUUID: e } = ki(), t = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu, r = (
    /** @type {const} */
    [
      "http",
      "https",
      "ws",
      "wss",
      "urn",
      "urn:uuid"
    ]
  );
  function n(m) {
    return r.indexOf(
      /** @type {*} */
      m
    ) !== -1;
  }
  function a(m) {
    return m.secure === !0 ? !0 : m.secure === !1 ? !1 : m.scheme ? m.scheme.length === 3 && (m.scheme[0] === "w" || m.scheme[0] === "W") && (m.scheme[1] === "s" || m.scheme[1] === "S") && (m.scheme[2] === "s" || m.scheme[2] === "S") : !1;
  }
  function s(m) {
    return m.host || (m.error = m.error || "HTTP URIs must have a host."), m;
  }
  function o(m) {
    const E = String(m.scheme).toLowerCase() === "https";
    return (m.port === (E ? 443 : 80) || m.port === "") && (m.port = void 0), m.path || (m.path = "/"), m;
  }
  function i(m) {
    return m.secure = a(m), m.resourceName = (m.path || "/") + (m.query ? "?" + m.query : ""), m.path = void 0, m.query = void 0, m;
  }
  function l(m) {
    if ((m.port === (a(m) ? 443 : 80) || m.port === "") && (m.port = void 0), typeof m.secure == "boolean" && (m.scheme = m.secure ? "wss" : "ws", m.secure = void 0), m.resourceName) {
      const [E, b] = m.resourceName.split("?");
      m.path = E && E !== "/" ? E : void 0, m.query = b, m.resourceName = void 0;
    }
    return m.fragment = void 0, m;
  }
  function u(m, E) {
    if (!m.path)
      return m.error = "URN can not be parsed", m;
    const b = m.path.match(t);
    if (b) {
      const T = E.scheme || m.scheme || "urn";
      m.nid = b[1].toLowerCase(), m.nss = b[2];
      const M = `${T}:${E.nid || m.nid}`, z = S(M);
      m.path = void 0, z && (m = z.parse(m, E));
    } else
      m.error = m.error || "URN can not be parsed.";
    return m;
  }
  function c(m, E) {
    if (m.nid === void 0)
      throw new Error("URN without nid cannot be serialized");
    const b = E.scheme || m.scheme || "urn", T = m.nid.toLowerCase(), M = `${b}:${E.nid || T}`, z = S(M);
    z && (m = z.serialize(m, E));
    const q = m, F = m.nss;
    return q.path = `${T || E.nid}:${F}`, E.skipEscape = !0, q;
  }
  function y(m, E) {
    const b = m;
    return b.uuid = b.nss, b.nss = void 0, !E.tolerant && (!b.uuid || !e(b.uuid)) && (b.error = b.error || "UUID is not valid."), b;
  }
  function f(m) {
    const E = m;
    return E.nss = (m.uuid || "").toLowerCase(), E;
  }
  const h = (
    /** @type {SchemeHandler} */
    {
      scheme: "http",
      domainHost: !0,
      parse: s,
      serialize: o
    }
  ), $ = (
    /** @type {SchemeHandler} */
    {
      scheme: "https",
      domainHost: h.domainHost,
      parse: s,
      serialize: o
    }
  ), _ = (
    /** @type {SchemeHandler} */
    {
      scheme: "ws",
      domainHost: !0,
      parse: i,
      serialize: l
    }
  ), p = (
    /** @type {SchemeHandler} */
    {
      scheme: "wss",
      domainHost: _.domainHost,
      parse: _.parse,
      serialize: _.serialize
    }
  ), g = (
    /** @type {Record<SchemeName, SchemeHandler>} */
    {
      http: h,
      https: $,
      ws: _,
      wss: p,
      urn: (
        /** @type {SchemeHandler} */
        {
          scheme: "urn",
          parse: u,
          serialize: c,
          skipNormalize: !0
        }
      ),
      "urn:uuid": (
        /** @type {SchemeHandler} */
        {
          scheme: "urn:uuid",
          parse: y,
          serialize: f,
          skipNormalize: !0
        }
      )
    }
  );
  Object.setPrototypeOf(g, null);
  function S(m) {
    return m && (g[
      /** @type {SchemeName} */
      m
    ] || g[
      /** @type {SchemeName} */
      m.toLowerCase()
    ]) || void 0;
  }
  return dn = {
    wsIsSecure: a,
    SCHEMES: g,
    isValidSchemeName: n,
    getSchemeHandler: S
  }, dn;
}
var fa;
function Zc() {
  if (fa) return mt.exports;
  fa = 1;
  const { normalizeIPv6: e, removeDotSegments: t, recomposeAuthority: r, normalizeComponentEncoding: n, isIPv4: a, nonSimpleDomain: s } = ki(), { SCHEMES: o, getSchemeHandler: i } = Qc();
  function l(p, v) {
    return typeof p == "string" ? p = /** @type {T} */
    f($(p, v), v) : typeof p == "object" && (p = /** @type {T} */
    $(f(p, v), v)), p;
  }
  function u(p, v, d) {
    const g = d ? Object.assign({ scheme: "null" }, d) : { scheme: "null" }, S = c($(p, g), $(v, g), g, !0);
    return g.skipEscape = !0, f(S, g);
  }
  function c(p, v, d, g) {
    const S = {};
    return g || (p = $(f(p, d), d), v = $(f(v, d), d)), d = d || {}, !d.tolerant && v.scheme ? (S.scheme = v.scheme, S.userinfo = v.userinfo, S.host = v.host, S.port = v.port, S.path = t(v.path || ""), S.query = v.query) : (v.userinfo !== void 0 || v.host !== void 0 || v.port !== void 0 ? (S.userinfo = v.userinfo, S.host = v.host, S.port = v.port, S.path = t(v.path || ""), S.query = v.query) : (v.path ? (v.path[0] === "/" ? S.path = t(v.path) : ((p.userinfo !== void 0 || p.host !== void 0 || p.port !== void 0) && !p.path ? S.path = "/" + v.path : p.path ? S.path = p.path.slice(0, p.path.lastIndexOf("/") + 1) + v.path : S.path = v.path, S.path = t(S.path)), S.query = v.query) : (S.path = p.path, v.query !== void 0 ? S.query = v.query : S.query = p.query), S.userinfo = p.userinfo, S.host = p.host, S.port = p.port), S.scheme = p.scheme), S.fragment = v.fragment, S;
  }
  function y(p, v, d) {
    return typeof p == "string" ? (p = unescape(p), p = f(n($(p, d), !0), { ...d, skipEscape: !0 })) : typeof p == "object" && (p = f(n(p, !0), { ...d, skipEscape: !0 })), typeof v == "string" ? (v = unescape(v), v = f(n($(v, d), !0), { ...d, skipEscape: !0 })) : typeof v == "object" && (v = f(n(v, !0), { ...d, skipEscape: !0 })), p.toLowerCase() === v.toLowerCase();
  }
  function f(p, v) {
    const d = {
      host: p.host,
      scheme: p.scheme,
      userinfo: p.userinfo,
      port: p.port,
      path: p.path,
      query: p.query,
      nid: p.nid,
      nss: p.nss,
      uuid: p.uuid,
      fragment: p.fragment,
      reference: p.reference,
      resourceName: p.resourceName,
      secure: p.secure,
      error: ""
    }, g = Object.assign({}, v), S = [], m = i(g.scheme || d.scheme);
    m && m.serialize && m.serialize(d, g), d.path !== void 0 && (g.skipEscape ? d.path = unescape(d.path) : (d.path = escape(d.path), d.scheme !== void 0 && (d.path = d.path.split("%3A").join(":")))), g.reference !== "suffix" && d.scheme && S.push(d.scheme, ":");
    const E = r(d);
    if (E !== void 0 && (g.reference !== "suffix" && S.push("//"), S.push(E), d.path && d.path[0] !== "/" && S.push("/")), d.path !== void 0) {
      let b = d.path;
      !g.absolutePath && (!m || !m.absolutePath) && (b = t(b)), E === void 0 && b[0] === "/" && b[1] === "/" && (b = "/%2F" + b.slice(2)), S.push(b);
    }
    return d.query !== void 0 && S.push("?", d.query), d.fragment !== void 0 && S.push("#", d.fragment), S.join("");
  }
  const h = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
  function $(p, v) {
    const d = Object.assign({}, v), g = {
      scheme: void 0,
      userinfo: void 0,
      host: "",
      port: void 0,
      path: "",
      query: void 0,
      fragment: void 0
    };
    let S = !1;
    d.reference === "suffix" && (d.scheme ? p = d.scheme + ":" + p : p = "//" + p);
    const m = p.match(h);
    if (m) {
      if (g.scheme = m[1], g.userinfo = m[3], g.host = m[4], g.port = parseInt(m[5], 10), g.path = m[6] || "", g.query = m[7], g.fragment = m[8], isNaN(g.port) && (g.port = m[5]), g.host)
        if (a(g.host) === !1) {
          const T = e(g.host);
          g.host = T.host.toLowerCase(), S = T.isIPV6;
        } else
          S = !0;
      g.scheme === void 0 && g.userinfo === void 0 && g.host === void 0 && g.port === void 0 && g.query === void 0 && !g.path ? g.reference = "same-document" : g.scheme === void 0 ? g.reference = "relative" : g.fragment === void 0 ? g.reference = "absolute" : g.reference = "uri", d.reference && d.reference !== "suffix" && d.reference !== g.reference && (g.error = g.error || "URI is not a " + d.reference + " reference.");
      const E = i(d.scheme || g.scheme);
      if (!d.unicodeSupport && (!E || !E.unicodeSupport) && g.host && (d.domainHost || E && E.domainHost) && S === !1 && s(g.host))
        try {
          g.host = URL.domainToASCII(g.host.toLowerCase());
        } catch (b) {
          g.error = g.error || "Host's domain name can not be converted to ASCII: " + b;
        }
      (!E || E && !E.skipNormalize) && (p.indexOf("%") !== -1 && (g.scheme !== void 0 && (g.scheme = unescape(g.scheme)), g.host !== void 0 && (g.host = unescape(g.host))), g.path && (g.path = escape(unescape(g.path))), g.fragment && (g.fragment = encodeURI(decodeURIComponent(g.fragment)))), E && E.parse && E.parse(g, d);
    } else
      g.error = g.error || "URI can not be parsed.";
    return g;
  }
  const _ = {
    SCHEMES: o,
    normalize: l,
    resolve: u,
    resolveComponent: c,
    equal: y,
    serialize: f,
    parse: $
  };
  return mt.exports = _, mt.exports.default = _, mt.exports.fastUri = _, mt.exports;
}
var pa;
function eu() {
  if (pa) return At;
  pa = 1, Object.defineProperty(At, "__esModule", { value: !0 });
  const e = Zc();
  return e.code = 'require("ajv/dist/runtime/uri").default', At.default = e, At;
}
var ha;
function Ci() {
  return ha || (ha = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.CodeGen = e.Name = e.nil = e.stringify = e.str = e._ = e.KeywordCxt = void 0;
    var t = /* @__PURE__ */ wt();
    Object.defineProperty(e, "KeywordCxt", { enumerable: !0, get: function() {
      return t.KeywordCxt;
    } });
    var r = /* @__PURE__ */ Y();
    Object.defineProperty(e, "_", { enumerable: !0, get: function() {
      return r._;
    } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
      return r.str;
    } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
      return r.stringify;
    } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
      return r.nil;
    } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
      return r.Name;
    } }), Object.defineProperty(e, "CodeGen", { enumerable: !0, get: function() {
      return r.CodeGen;
    } });
    const n = /* @__PURE__ */ Gr(), a = /* @__PURE__ */ St(), s = /* @__PURE__ */ Ni(), o = /* @__PURE__ */ xr(), i = /* @__PURE__ */ Y(), l = /* @__PURE__ */ zr(), u = /* @__PURE__ */ kr(), c = /* @__PURE__ */ ee(), y = Jc, f = /* @__PURE__ */ eu(), h = (k, P) => new RegExp(k, P);
    h.code = "new RegExp";
    const $ = ["removeAdditional", "useDefaults", "coerceTypes"], _ = /* @__PURE__ */ new Set([
      "validate",
      "serialize",
      "parse",
      "wrapper",
      "root",
      "schema",
      "keyword",
      "pattern",
      "formats",
      "validate$data",
      "func",
      "obj",
      "Error"
    ]), p = {
      errorDataPath: "",
      format: "`validateFormats: false` can be used instead.",
      nullable: '"nullable" keyword is supported by default.',
      jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
      extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
      missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
      processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
      sourceCode: "Use option `code: {source: true}`",
      strictDefaults: "It is default now, see option `strict`.",
      strictKeywords: "It is default now, see option `strict`.",
      uniqueItems: '"uniqueItems" keyword is always validated.',
      unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
      cache: "Map is used as cache, schema object as key.",
      serialize: "Map is used as cache, schema object as key.",
      ajvErrors: "It is default now."
    }, v = {
      ignoreKeywordsWithRef: "",
      jsPropertySyntax: "",
      unicode: '"minLength"/"maxLength" account for unicode characters by default.'
    }, d = 200;
    function g(k) {
      var P, A, I, w, R, C, B, X, re, te, O, N, L, U, W, Z, ce, we, ge, ve, ue, Ye, Ee, Jr, Qr;
      const ft = k.strict, Zr = (P = k.code) === null || P === void 0 ? void 0 : P.optimize, qs = Zr === !0 || Zr === void 0 ? 1 : Zr || 0, Ds = (I = (A = k.code) === null || A === void 0 ? void 0 : A.regExp) !== null && I !== void 0 ? I : h, cc = (w = k.uriResolver) !== null && w !== void 0 ? w : f.default;
      return {
        strictSchema: (C = (R = k.strictSchema) !== null && R !== void 0 ? R : ft) !== null && C !== void 0 ? C : !0,
        strictNumbers: (X = (B = k.strictNumbers) !== null && B !== void 0 ? B : ft) !== null && X !== void 0 ? X : !0,
        strictTypes: (te = (re = k.strictTypes) !== null && re !== void 0 ? re : ft) !== null && te !== void 0 ? te : "log",
        strictTuples: (N = (O = k.strictTuples) !== null && O !== void 0 ? O : ft) !== null && N !== void 0 ? N : "log",
        strictRequired: (U = (L = k.strictRequired) !== null && L !== void 0 ? L : ft) !== null && U !== void 0 ? U : !1,
        code: k.code ? { ...k.code, optimize: qs, regExp: Ds } : { optimize: qs, regExp: Ds },
        loopRequired: (W = k.loopRequired) !== null && W !== void 0 ? W : d,
        loopEnum: (Z = k.loopEnum) !== null && Z !== void 0 ? Z : d,
        meta: (ce = k.meta) !== null && ce !== void 0 ? ce : !0,
        messages: (we = k.messages) !== null && we !== void 0 ? we : !0,
        inlineRefs: (ge = k.inlineRefs) !== null && ge !== void 0 ? ge : !0,
        schemaId: (ve = k.schemaId) !== null && ve !== void 0 ? ve : "$id",
        addUsedSchema: (ue = k.addUsedSchema) !== null && ue !== void 0 ? ue : !0,
        validateSchema: (Ye = k.validateSchema) !== null && Ye !== void 0 ? Ye : !0,
        validateFormats: (Ee = k.validateFormats) !== null && Ee !== void 0 ? Ee : !0,
        unicodeRegExp: (Jr = k.unicodeRegExp) !== null && Jr !== void 0 ? Jr : !0,
        int32range: (Qr = k.int32range) !== null && Qr !== void 0 ? Qr : !0,
        uriResolver: cc
      };
    }
    class S {
      constructor(P = {}) {
        this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), P = this.opts = { ...P, ...g(P) };
        const { es5: A, lines: I } = this.opts.code;
        this.scope = new i.ValueScope({ scope: {}, prefixes: _, es5: A, lines: I }), this.logger = F(P.logger);
        const w = P.validateFormats;
        P.validateFormats = !1, this.RULES = (0, s.getRules)(), m.call(this, p, P, "NOT SUPPORTED"), m.call(this, v, P, "DEPRECATED", "warn"), this._metaOpts = z.call(this), P.formats && T.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), P.keywords && M.call(this, P.keywords), typeof P.meta == "object" && this.addMetaSchema(P.meta), b.call(this), P.validateFormats = w;
      }
      _addVocabularies() {
        this.addKeyword("$async");
      }
      _addDefaultMetaSchema() {
        const { $data: P, meta: A, schemaId: I } = this.opts;
        let w = y;
        I === "id" && (w = { ...y }, w.id = w.$id, delete w.$id), A && P && this.addMetaSchema(w, w[I], !1);
      }
      defaultMeta() {
        const { meta: P, schemaId: A } = this.opts;
        return this.opts.defaultMeta = typeof P == "object" ? P[A] || P : void 0;
      }
      validate(P, A) {
        let I;
        if (typeof P == "string") {
          if (I = this.getSchema(P), !I)
            throw new Error(`no schema with key or ref "${P}"`);
        } else
          I = this.compile(P);
        const w = I(A);
        return "$async" in I || (this.errors = I.errors), w;
      }
      compile(P, A) {
        const I = this._addSchema(P, A);
        return I.validate || this._compileSchemaEnv(I);
      }
      compileAsync(P, A) {
        if (typeof this.opts.loadSchema != "function")
          throw new Error("options.loadSchema should be a function");
        const { loadSchema: I } = this.opts;
        return w.call(this, P, A);
        async function w(te, O) {
          await R.call(this, te.$schema);
          const N = this._addSchema(te, O);
          return N.validate || C.call(this, N);
        }
        async function R(te) {
          te && !this.getSchema(te) && await w.call(this, { $ref: te }, !0);
        }
        async function C(te) {
          try {
            return this._compileSchemaEnv(te);
          } catch (O) {
            if (!(O instanceof a.default))
              throw O;
            return B.call(this, O), await X.call(this, O.missingSchema), C.call(this, te);
          }
        }
        function B({ missingSchema: te, missingRef: O }) {
          if (this.refs[te])
            throw new Error(`AnySchema ${te} is loaded but ${O} cannot be resolved`);
        }
        async function X(te) {
          const O = await re.call(this, te);
          this.refs[te] || await R.call(this, O.$schema), this.refs[te] || this.addSchema(O, te, A);
        }
        async function re(te) {
          const O = this._loading[te];
          if (O)
            return O;
          try {
            return await (this._loading[te] = I(te));
          } finally {
            delete this._loading[te];
          }
        }
      }
      // Adds schema to the instance
      addSchema(P, A, I, w = this.opts.validateSchema) {
        if (Array.isArray(P)) {
          for (const C of P)
            this.addSchema(C, void 0, I, w);
          return this;
        }
        let R;
        if (typeof P == "object") {
          const { schemaId: C } = this.opts;
          if (R = P[C], R !== void 0 && typeof R != "string")
            throw new Error(`schema ${C} must be string`);
        }
        return A = (0, l.normalizeId)(A || R), this._checkUnique(A), this.schemas[A] = this._addSchema(P, I, A, w, !0), this;
      }
      // Add schema that will be used to validate other schemas
      // options in META_IGNORE_OPTIONS are alway set to false
      addMetaSchema(P, A, I = this.opts.validateSchema) {
        return this.addSchema(P, A, !0, I), this;
      }
      //  Validate schema against its meta-schema
      validateSchema(P, A) {
        if (typeof P == "boolean")
          return !0;
        let I;
        if (I = P.$schema, I !== void 0 && typeof I != "string")
          throw new Error("$schema must be a string");
        if (I = I || this.opts.defaultMeta || this.defaultMeta(), !I)
          return this.logger.warn("meta-schema not available"), this.errors = null, !0;
        const w = this.validate(I, P);
        if (!w && A) {
          const R = "schema is invalid: " + this.errorsText();
          if (this.opts.validateSchema === "log")
            this.logger.error(R);
          else
            throw new Error(R);
        }
        return w;
      }
      // Get compiled schema by `key` or `ref`.
      // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
      getSchema(P) {
        let A;
        for (; typeof (A = E.call(this, P)) == "string"; )
          P = A;
        if (A === void 0) {
          const { schemaId: I } = this.opts, w = new o.SchemaEnv({ schema: {}, schemaId: I });
          if (A = o.resolveSchema.call(this, w, P), !A)
            return;
          this.refs[P] = A;
        }
        return A.validate || this._compileSchemaEnv(A);
      }
      // Remove cached schema(s).
      // If no parameter is passed all schemas but meta-schemas are removed.
      // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
      // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
      removeSchema(P) {
        if (P instanceof RegExp)
          return this._removeAllSchemas(this.schemas, P), this._removeAllSchemas(this.refs, P), this;
        switch (typeof P) {
          case "undefined":
            return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
          case "string": {
            const A = E.call(this, P);
            return typeof A == "object" && this._cache.delete(A.schema), delete this.schemas[P], delete this.refs[P], this;
          }
          case "object": {
            const A = P;
            this._cache.delete(A);
            let I = P[this.opts.schemaId];
            return I && (I = (0, l.normalizeId)(I), delete this.schemas[I], delete this.refs[I]), this;
          }
          default:
            throw new Error("ajv.removeSchema: invalid parameter");
        }
      }
      // add "vocabulary" - a collection of keywords
      addVocabulary(P) {
        for (const A of P)
          this.addKeyword(A);
        return this;
      }
      addKeyword(P, A) {
        let I;
        if (typeof P == "string")
          I = P, typeof A == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), A.keyword = I);
        else if (typeof P == "object" && A === void 0) {
          if (A = P, I = A.keyword, Array.isArray(I) && !I.length)
            throw new Error("addKeywords: keyword must be string or non-empty array");
        } else
          throw new Error("invalid addKeywords parameters");
        if (j.call(this, I, A), !A)
          return (0, c.eachItem)(I, (R) => D.call(this, R)), this;
        x.call(this, A);
        const w = {
          ...A,
          type: (0, u.getJSONTypes)(A.type),
          schemaType: (0, u.getJSONTypes)(A.schemaType)
        };
        return (0, c.eachItem)(I, w.type.length === 0 ? (R) => D.call(this, R, w) : (R) => w.type.forEach((C) => D.call(this, R, w, C))), this;
      }
      getKeyword(P) {
        const A = this.RULES.all[P];
        return typeof A == "object" ? A.definition : !!A;
      }
      // Remove keyword
      removeKeyword(P) {
        const { RULES: A } = this;
        delete A.keywords[P], delete A.all[P];
        for (const I of A.rules) {
          const w = I.rules.findIndex((R) => R.keyword === P);
          w >= 0 && I.rules.splice(w, 1);
        }
        return this;
      }
      // Add format
      addFormat(P, A) {
        return typeof A == "string" && (A = new RegExp(A)), this.formats[P] = A, this;
      }
      errorsText(P = this.errors, { separator: A = ", ", dataVar: I = "data" } = {}) {
        return !P || P.length === 0 ? "No errors" : P.map((w) => `${I}${w.instancePath} ${w.message}`).reduce((w, R) => w + A + R);
      }
      $dataMetaSchema(P, A) {
        const I = this.RULES.all;
        P = JSON.parse(JSON.stringify(P));
        for (const w of A) {
          const R = w.split("/").slice(1);
          let C = P;
          for (const B of R)
            C = C[B];
          for (const B in I) {
            const X = I[B];
            if (typeof X != "object")
              continue;
            const { $data: re } = X.definition, te = C[B];
            re && te && (C[B] = K(te));
          }
        }
        return P;
      }
      _removeAllSchemas(P, A) {
        for (const I in P) {
          const w = P[I];
          (!A || A.test(I)) && (typeof w == "string" ? delete P[I] : w && !w.meta && (this._cache.delete(w.schema), delete P[I]));
        }
      }
      _addSchema(P, A, I, w = this.opts.validateSchema, R = this.opts.addUsedSchema) {
        let C;
        const { schemaId: B } = this.opts;
        if (typeof P == "object")
          C = P[B];
        else {
          if (this.opts.jtd)
            throw new Error("schema must be object");
          if (typeof P != "boolean")
            throw new Error("schema must be object or boolean");
        }
        let X = this._cache.get(P);
        if (X !== void 0)
          return X;
        I = (0, l.normalizeId)(C || I);
        const re = l.getSchemaRefs.call(this, P, I);
        return X = new o.SchemaEnv({ schema: P, schemaId: B, meta: A, baseId: I, localRefs: re }), this._cache.set(X.schema, X), R && !I.startsWith("#") && (I && this._checkUnique(I), this.refs[I] = X), w && this.validateSchema(P, !0), X;
      }
      _checkUnique(P) {
        if (this.schemas[P] || this.refs[P])
          throw new Error(`schema with key or id "${P}" already exists`);
      }
      _compileSchemaEnv(P) {
        if (P.meta ? this._compileMetaSchema(P) : o.compileSchema.call(this, P), !P.validate)
          throw new Error("ajv implementation error");
        return P.validate;
      }
      _compileMetaSchema(P) {
        const A = this.opts;
        this.opts = this._metaOpts;
        try {
          o.compileSchema.call(this, P);
        } finally {
          this.opts = A;
        }
      }
    }
    S.ValidationError = n.default, S.MissingRefError = a.default, e.default = S;
    function m(k, P, A, I = "error") {
      for (const w in k) {
        const R = w;
        R in P && this.logger[I](`${A}: option ${w}. ${k[R]}`);
      }
    }
    function E(k) {
      return k = (0, l.normalizeId)(k), this.schemas[k] || this.refs[k];
    }
    function b() {
      const k = this.opts.schemas;
      if (k)
        if (Array.isArray(k))
          this.addSchema(k);
        else
          for (const P in k)
            this.addSchema(k[P], P);
    }
    function T() {
      for (const k in this.opts.formats) {
        const P = this.opts.formats[k];
        P && this.addFormat(k, P);
      }
    }
    function M(k) {
      if (Array.isArray(k)) {
        this.addVocabulary(k);
        return;
      }
      this.logger.warn("keywords option as map is deprecated, pass array");
      for (const P in k) {
        const A = k[P];
        A.keyword || (A.keyword = P), this.addKeyword(A);
      }
    }
    function z() {
      const k = { ...this.opts };
      for (const P of $)
        delete k[P];
      return k;
    }
    const q = { log() {
    }, warn() {
    }, error() {
    } };
    function F(k) {
      if (k === !1)
        return q;
      if (k === void 0)
        return console;
      if (k.log && k.warn && k.error)
        return k;
      throw new Error("logger must implement log, warn and error methods");
    }
    const G = /^[a-z_$][a-z0-9_$:-]*$/i;
    function j(k, P) {
      const { RULES: A } = this;
      if ((0, c.eachItem)(k, (I) => {
        if (A.keywords[I])
          throw new Error(`Keyword ${I} is already defined`);
        if (!G.test(I))
          throw new Error(`Keyword ${I} has invalid name`);
      }), !!P && P.$data && !("code" in P || "validate" in P))
        throw new Error('$data keyword must have "code" or "validate" function');
    }
    function D(k, P, A) {
      var I;
      const w = P?.post;
      if (A && w)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES: R } = this;
      let C = w ? R.post : R.rules.find(({ type: X }) => X === A);
      if (C || (C = { type: A, rules: [] }, R.rules.push(C)), R.keywords[k] = !0, !P)
        return;
      const B = {
        keyword: k,
        definition: {
          ...P,
          type: (0, u.getJSONTypes)(P.type),
          schemaType: (0, u.getJSONTypes)(P.schemaType)
        }
      };
      P.before ? H.call(this, C, B, P.before) : C.rules.push(B), R.all[k] = B, (I = P.implements) === null || I === void 0 || I.forEach((X) => this.addKeyword(X));
    }
    function H(k, P, A) {
      const I = k.rules.findIndex((w) => w.keyword === A);
      I >= 0 ? k.rules.splice(I, 0, P) : (k.rules.push(P), this.logger.warn(`rule ${A} is not defined`));
    }
    function x(k) {
      let { metaSchema: P } = k;
      P !== void 0 && (k.$data && this.opts.$data && (P = K(P)), k.validateSchema = this.compile(P, !0));
    }
    const V = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
    };
    function K(k) {
      return { anyOf: [k, V] };
    }
  })(rn)), rn;
}
var jt = {}, kt = {}, Ct = {}, ma;
function tu() {
  if (ma) return Ct;
  ma = 1, Object.defineProperty(Ct, "__esModule", { value: !0 });
  const e = {
    keyword: "id",
    code() {
      throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
    }
  };
  return Ct.default = e, Ct;
}
var Fe = {}, ya;
function Ss() {
  if (ya) return Fe;
  ya = 1, Object.defineProperty(Fe, "__esModule", { value: !0 }), Fe.callRef = Fe.getValidate = void 0;
  const e = /* @__PURE__ */ St(), t = /* @__PURE__ */ Ie(), r = /* @__PURE__ */ Y(), n = /* @__PURE__ */ Pe(), a = /* @__PURE__ */ xr(), s = /* @__PURE__ */ ee(), o = {
    keyword: "$ref",
    schemaType: "string",
    code(u) {
      const { gen: c, schema: y, it: f } = u, { baseId: h, schemaEnv: $, validateName: _, opts: p, self: v } = f, { root: d } = $;
      if ((y === "#" || y === "#/") && h === d.baseId)
        return S();
      const g = a.resolveRef.call(v, d, h, y);
      if (g === void 0)
        throw new e.default(f.opts.uriResolver, h, y);
      if (g instanceof a.SchemaEnv)
        return m(g);
      return E(g);
      function S() {
        if ($ === d)
          return l(u, _, $, $.$async);
        const b = c.scopeValue("root", { ref: d });
        return l(u, (0, r._)`${b}.validate`, d, d.$async);
      }
      function m(b) {
        const T = i(u, b);
        l(u, T, b, b.$async);
      }
      function E(b) {
        const T = c.scopeValue("schema", p.code.source === !0 ? { ref: b, code: (0, r.stringify)(b) } : { ref: b }), M = c.name("valid"), z = u.subschema({
          schema: b,
          dataTypes: [],
          schemaPath: r.nil,
          topSchemaRef: T,
          errSchemaPath: y
        }, M);
        u.mergeEvaluated(z), u.ok(M);
      }
    }
  };
  function i(u, c) {
    const { gen: y } = u;
    return c.validate ? y.scopeValue("validate", { ref: c.validate }) : (0, r._)`${y.scopeValue("wrapper", { ref: c })}.validate`;
  }
  Fe.getValidate = i;
  function l(u, c, y, f) {
    const { gen: h, it: $ } = u, { allErrors: _, schemaEnv: p, opts: v } = $, d = v.passContext ? n.default.this : r.nil;
    f ? g() : S();
    function g() {
      if (!p.$async)
        throw new Error("async schema referenced by sync schema");
      const b = h.let("valid");
      h.try(() => {
        h.code((0, r._)`await ${(0, t.callValidateCode)(u, c, d)}`), E(c), _ || h.assign(b, !0);
      }, (T) => {
        h.if((0, r._)`!(${T} instanceof ${$.ValidationError})`, () => h.throw(T)), m(T), _ || h.assign(b, !1);
      }), u.ok(b);
    }
    function S() {
      u.result((0, t.callValidateCode)(u, c, d), () => E(c), () => m(c));
    }
    function m(b) {
      const T = (0, r._)`${b}.errors`;
      h.assign(n.default.vErrors, (0, r._)`${n.default.vErrors} === null ? ${T} : ${n.default.vErrors}.concat(${T})`), h.assign(n.default.errors, (0, r._)`${n.default.vErrors}.length`);
    }
    function E(b) {
      var T;
      if (!$.opts.unevaluated)
        return;
      const M = (T = y?.validate) === null || T === void 0 ? void 0 : T.evaluated;
      if ($.props !== !0)
        if (M && !M.dynamicProps)
          M.props !== void 0 && ($.props = s.mergeEvaluated.props(h, M.props, $.props));
        else {
          const z = h.var("props", (0, r._)`${b}.evaluated.props`);
          $.props = s.mergeEvaluated.props(h, z, $.props, r.Name);
        }
      if ($.items !== !0)
        if (M && !M.dynamicItems)
          M.items !== void 0 && ($.items = s.mergeEvaluated.items(h, M.items, $.items));
        else {
          const z = h.var("items", (0, r._)`${b}.evaluated.items`);
          $.items = s.mergeEvaluated.items(h, z, $.items, r.Name);
        }
    }
  }
  return Fe.callRef = l, Fe.default = o, Fe;
}
var ga;
function qi() {
  if (ga) return kt;
  ga = 1, Object.defineProperty(kt, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ tu(), t = /* @__PURE__ */ Ss(), r = [
    "$schema",
    "$id",
    "$defs",
    "$vocabulary",
    { keyword: "$comment" },
    "definitions",
    e.default,
    t.default
  ];
  return kt.default = r, kt;
}
var qt = {}, Dt = {}, va;
function ru() {
  if (va) return Dt;
  va = 1, Object.defineProperty(Dt, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Y(), t = e.operators, r = {
    maximum: { okStr: "<=", ok: t.LTE, fail: t.GT },
    minimum: { okStr: ">=", ok: t.GTE, fail: t.LT },
    exclusiveMaximum: { okStr: "<", ok: t.LT, fail: t.GTE },
    exclusiveMinimum: { okStr: ">", ok: t.GT, fail: t.LTE }
  }, n = {
    message: ({ keyword: s, schemaCode: o }) => (0, e.str)`must be ${r[s].okStr} ${o}`,
    params: ({ keyword: s, schemaCode: o }) => (0, e._)`{comparison: ${r[s].okStr}, limit: ${o}}`
  }, a = {
    keyword: Object.keys(r),
    type: "number",
    schemaType: "number",
    $data: !0,
    error: n,
    code(s) {
      const { keyword: o, data: i, schemaCode: l } = s;
      s.fail$data((0, e._)`${i} ${r[o].fail} ${l} || isNaN(${i})`);
    }
  };
  return Dt.default = a, Dt;
}
var Lt = {}, _a;
function nu() {
  if (_a) return Lt;
  _a = 1, Object.defineProperty(Lt, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Y(), r = {
    keyword: "multipleOf",
    type: "number",
    schemaType: "number",
    $data: !0,
    error: {
      message: ({ schemaCode: n }) => (0, e.str)`must be multiple of ${n}`,
      params: ({ schemaCode: n }) => (0, e._)`{multipleOf: ${n}}`
    },
    code(n) {
      const { gen: a, data: s, schemaCode: o, it: i } = n, l = i.opts.multipleOfPrecision, u = a.let("res"), c = l ? (0, e._)`Math.abs(Math.round(${u}) - ${u}) > 1e-${l}` : (0, e._)`${u} !== parseInt(${u})`;
      n.fail$data((0, e._)`(${o} === 0 || (${u} = ${s}/${o}, ${c}))`);
    }
  };
  return Lt.default = r, Lt;
}
var Mt = {}, Ut = {}, $a;
function su() {
  if ($a) return Ut;
  $a = 1, Object.defineProperty(Ut, "__esModule", { value: !0 });
  function e(t) {
    const r = t.length;
    let n = 0, a = 0, s;
    for (; a < r; )
      n++, s = t.charCodeAt(a++), s >= 55296 && s <= 56319 && a < r && (s = t.charCodeAt(a), (s & 64512) === 56320 && a++);
    return n;
  }
  return Ut.default = e, e.code = 'require("ajv/dist/runtime/ucs2length").default', Ut;
}
var Ea;
function au() {
  if (Ea) return Mt;
  Ea = 1, Object.defineProperty(Mt, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ ee(), r = /* @__PURE__ */ su(), a = {
    keyword: ["maxLength", "minLength"],
    type: "string",
    schemaType: "number",
    $data: !0,
    error: {
      message({ keyword: s, schemaCode: o }) {
        const i = s === "maxLength" ? "more" : "fewer";
        return (0, e.str)`must NOT have ${i} than ${o} characters`;
      },
      params: ({ schemaCode: s }) => (0, e._)`{limit: ${s}}`
    },
    code(s) {
      const { keyword: o, data: i, schemaCode: l, it: u } = s, c = o === "maxLength" ? e.operators.GT : e.operators.LT, y = u.opts.unicode === !1 ? (0, e._)`${i}.length` : (0, e._)`${(0, t.useFunc)(s.gen, r.default)}(${i})`;
      s.fail$data((0, e._)`${y} ${c} ${l}`);
    }
  };
  return Mt.default = a, Mt;
}
var Ft = {}, wa;
function ou() {
  if (wa) return Ft;
  wa = 1, Object.defineProperty(Ft, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Ie(), t = /* @__PURE__ */ ee(), r = /* @__PURE__ */ Y(), a = {
    keyword: "pattern",
    type: "string",
    schemaType: "string",
    $data: !0,
    error: {
      message: ({ schemaCode: s }) => (0, r.str)`must match pattern "${s}"`,
      params: ({ schemaCode: s }) => (0, r._)`{pattern: ${s}}`
    },
    code(s) {
      const { gen: o, data: i, $data: l, schema: u, schemaCode: c, it: y } = s, f = y.opts.unicodeRegExp ? "u" : "";
      if (l) {
        const { regExp: h } = y.opts.code, $ = h.code === "new RegExp" ? (0, r._)`new RegExp` : (0, t.useFunc)(o, h), _ = o.let("valid");
        o.try(() => o.assign(_, (0, r._)`${$}(${c}, ${f}).test(${i})`), () => o.assign(_, !1)), s.fail$data((0, r._)`!${_}`);
      } else {
        const h = (0, e.usePattern)(s, u);
        s.fail$data((0, r._)`!${h}.test(${i})`);
      }
    }
  };
  return Ft.default = a, Ft;
}
var Vt = {}, Sa;
function iu() {
  if (Sa) return Vt;
  Sa = 1, Object.defineProperty(Vt, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Y(), r = {
    keyword: ["maxProperties", "minProperties"],
    type: "object",
    schemaType: "number",
    $data: !0,
    error: {
      message({ keyword: n, schemaCode: a }) {
        const s = n === "maxProperties" ? "more" : "fewer";
        return (0, e.str)`must NOT have ${s} than ${a} properties`;
      },
      params: ({ schemaCode: n }) => (0, e._)`{limit: ${n}}`
    },
    code(n) {
      const { keyword: a, data: s, schemaCode: o } = n, i = a === "maxProperties" ? e.operators.GT : e.operators.LT;
      n.fail$data((0, e._)`Object.keys(${s}).length ${i} ${o}`);
    }
  };
  return Vt.default = r, Vt;
}
var zt = {}, ba;
function cu() {
  if (ba) return zt;
  ba = 1, Object.defineProperty(zt, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Ie(), t = /* @__PURE__ */ Y(), r = /* @__PURE__ */ ee(), a = {
    keyword: "required",
    type: "object",
    schemaType: "array",
    $data: !0,
    error: {
      message: ({ params: { missingProperty: s } }) => (0, t.str)`must have required property '${s}'`,
      params: ({ params: { missingProperty: s } }) => (0, t._)`{missingProperty: ${s}}`
    },
    code(s) {
      const { gen: o, schema: i, schemaCode: l, data: u, $data: c, it: y } = s, { opts: f } = y;
      if (!c && i.length === 0)
        return;
      const h = i.length >= f.loopRequired;
      if (y.allErrors ? $() : _(), f.strictRequired) {
        const d = s.parentSchema.properties, { definedProperties: g } = s.it;
        for (const S of i)
          if (d?.[S] === void 0 && !g.has(S)) {
            const m = y.schemaEnv.baseId + y.errSchemaPath, E = `required property "${S}" is not defined at "${m}" (strictRequired)`;
            (0, r.checkStrictMode)(y, E, y.opts.strictRequired);
          }
      }
      function $() {
        if (h || c)
          s.block$data(t.nil, p);
        else
          for (const d of i)
            (0, e.checkReportMissingProp)(s, d);
      }
      function _() {
        const d = o.let("missing");
        if (h || c) {
          const g = o.let("valid", !0);
          s.block$data(g, () => v(d, g)), s.ok(g);
        } else
          o.if((0, e.checkMissingProp)(s, i, d)), (0, e.reportMissingProp)(s, d), o.else();
      }
      function p() {
        o.forOf("prop", l, (d) => {
          s.setParams({ missingProperty: d }), o.if((0, e.noPropertyInData)(o, u, d, f.ownProperties), () => s.error());
        });
      }
      function v(d, g) {
        s.setParams({ missingProperty: d }), o.forOf(d, l, () => {
          o.assign(g, (0, e.propertyInData)(o, u, d, f.ownProperties)), o.if((0, t.not)(g), () => {
            s.error(), o.break();
          });
        }, t.nil);
      }
    }
  };
  return zt.default = a, zt;
}
var Gt = {}, Ra;
function uu() {
  if (Ra) return Gt;
  Ra = 1, Object.defineProperty(Gt, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Y(), r = {
    keyword: ["maxItems", "minItems"],
    type: "array",
    schemaType: "number",
    $data: !0,
    error: {
      message({ keyword: n, schemaCode: a }) {
        const s = n === "maxItems" ? "more" : "fewer";
        return (0, e.str)`must NOT have ${s} than ${a} items`;
      },
      params: ({ schemaCode: n }) => (0, e._)`{limit: ${n}}`
    },
    code(n) {
      const { keyword: a, data: s, schemaCode: o } = n, i = a === "maxItems" ? e.operators.GT : e.operators.LT;
      n.fail$data((0, e._)`${s}.length ${i} ${o}`);
    }
  };
  return Gt.default = r, Gt;
}
var xt = {}, Kt = {}, Pa;
function bs() {
  if (Pa) return Kt;
  Pa = 1, Object.defineProperty(Kt, "__esModule", { value: !0 });
  const e = ji();
  return e.code = 'require("ajv/dist/runtime/equal").default', Kt.default = e, Kt;
}
var Ia;
function lu() {
  if (Ia) return xt;
  Ia = 1, Object.defineProperty(xt, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ kr(), t = /* @__PURE__ */ Y(), r = /* @__PURE__ */ ee(), n = /* @__PURE__ */ bs(), s = {
    keyword: "uniqueItems",
    type: "array",
    schemaType: "boolean",
    $data: !0,
    error: {
      message: ({ params: { i: o, j: i } }) => (0, t.str)`must NOT have duplicate items (items ## ${i} and ${o} are identical)`,
      params: ({ params: { i: o, j: i } }) => (0, t._)`{i: ${o}, j: ${i}}`
    },
    code(o) {
      const { gen: i, data: l, $data: u, schema: c, parentSchema: y, schemaCode: f, it: h } = o;
      if (!u && !c)
        return;
      const $ = i.let("valid"), _ = y.items ? (0, e.getSchemaTypes)(y.items) : [];
      o.block$data($, p, (0, t._)`${f} === false`), o.ok($);
      function p() {
        const S = i.let("i", (0, t._)`${l}.length`), m = i.let("j");
        o.setParams({ i: S, j: m }), i.assign($, !0), i.if((0, t._)`${S} > 1`, () => (v() ? d : g)(S, m));
      }
      function v() {
        return _.length > 0 && !_.some((S) => S === "object" || S === "array");
      }
      function d(S, m) {
        const E = i.name("item"), b = (0, e.checkDataTypes)(_, E, h.opts.strictNumbers, e.DataType.Wrong), T = i.const("indices", (0, t._)`{}`);
        i.for((0, t._)`;${S}--;`, () => {
          i.let(E, (0, t._)`${l}[${S}]`), i.if(b, (0, t._)`continue`), _.length > 1 && i.if((0, t._)`typeof ${E} == "string"`, (0, t._)`${E} += "_"`), i.if((0, t._)`typeof ${T}[${E}] == "number"`, () => {
            i.assign(m, (0, t._)`${T}[${E}]`), o.error(), i.assign($, !1).break();
          }).code((0, t._)`${T}[${E}] = ${S}`);
        });
      }
      function g(S, m) {
        const E = (0, r.useFunc)(i, n.default), b = i.name("outer");
        i.label(b).for((0, t._)`;${S}--;`, () => i.for((0, t._)`${m} = ${S}; ${m}--;`, () => i.if((0, t._)`${E}(${l}[${S}], ${l}[${m}])`, () => {
          o.error(), i.assign($, !1).break(b);
        })));
      }
    }
  };
  return xt.default = s, xt;
}
var Ht = {}, Oa;
function du() {
  if (Oa) return Ht;
  Oa = 1, Object.defineProperty(Ht, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ ee(), r = /* @__PURE__ */ bs(), a = {
    keyword: "const",
    $data: !0,
    error: {
      message: "must be equal to constant",
      params: ({ schemaCode: s }) => (0, e._)`{allowedValue: ${s}}`
    },
    code(s) {
      const { gen: o, data: i, $data: l, schemaCode: u, schema: c } = s;
      l || c && typeof c == "object" ? s.fail$data((0, e._)`!${(0, t.useFunc)(o, r.default)}(${i}, ${u})`) : s.fail((0, e._)`${c} !== ${i}`);
    }
  };
  return Ht.default = a, Ht;
}
var Bt = {}, Ta;
function fu() {
  if (Ta) return Bt;
  Ta = 1, Object.defineProperty(Bt, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ ee(), r = /* @__PURE__ */ bs(), a = {
    keyword: "enum",
    schemaType: "array",
    $data: !0,
    error: {
      message: "must be equal to one of the allowed values",
      params: ({ schemaCode: s }) => (0, e._)`{allowedValues: ${s}}`
    },
    code(s) {
      const { gen: o, data: i, $data: l, schema: u, schemaCode: c, it: y } = s;
      if (!l && u.length === 0)
        throw new Error("enum must have non-empty array");
      const f = u.length >= y.opts.loopEnum;
      let h;
      const $ = () => h ?? (h = (0, t.useFunc)(o, r.default));
      let _;
      if (f || l)
        _ = o.let("valid"), s.block$data(_, p);
      else {
        if (!Array.isArray(u))
          throw new Error("ajv implementation error");
        const d = o.const("vSchema", c);
        _ = (0, e.or)(...u.map((g, S) => v(d, S)));
      }
      s.pass(_);
      function p() {
        o.assign(_, !1), o.forOf("v", c, (d) => o.if((0, e._)`${$()}(${i}, ${d})`, () => o.assign(_, !0).break()));
      }
      function v(d, g) {
        const S = u[g];
        return typeof S == "object" && S !== null ? (0, e._)`${$()}(${i}, ${d}[${g}])` : (0, e._)`${i} === ${S}`;
      }
    }
  };
  return Bt.default = a, Bt;
}
var Na;
function Di() {
  if (Na) return qt;
  Na = 1, Object.defineProperty(qt, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ ru(), t = /* @__PURE__ */ nu(), r = /* @__PURE__ */ au(), n = /* @__PURE__ */ ou(), a = /* @__PURE__ */ iu(), s = /* @__PURE__ */ cu(), o = /* @__PURE__ */ uu(), i = /* @__PURE__ */ lu(), l = /* @__PURE__ */ du(), u = /* @__PURE__ */ fu(), c = [
    // number
    e.default,
    t.default,
    // string
    r.default,
    n.default,
    // object
    a.default,
    s.default,
    // array
    o.default,
    i.default,
    // any
    { keyword: "type", schemaType: ["string", "array"] },
    { keyword: "nullable", schemaType: "boolean" },
    l.default,
    u.default
  ];
  return qt.default = c, qt;
}
var Wt = {}, Je = {}, Aa;
function Li() {
  if (Aa) return Je;
  Aa = 1, Object.defineProperty(Je, "__esModule", { value: !0 }), Je.validateAdditionalItems = void 0;
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ ee(), n = {
    keyword: "additionalItems",
    type: "array",
    schemaType: ["boolean", "object"],
    before: "uniqueItems",
    error: {
      message: ({ params: { len: s } }) => (0, e.str)`must NOT have more than ${s} items`,
      params: ({ params: { len: s } }) => (0, e._)`{limit: ${s}}`
    },
    code(s) {
      const { parentSchema: o, it: i } = s, { items: l } = o;
      if (!Array.isArray(l)) {
        (0, t.checkStrictMode)(i, '"additionalItems" is ignored when "items" is not an array of schemas');
        return;
      }
      a(s, l);
    }
  };
  function a(s, o) {
    const { gen: i, schema: l, data: u, keyword: c, it: y } = s;
    y.items = !0;
    const f = i.const("len", (0, e._)`${u}.length`);
    if (l === !1)
      s.setParams({ len: o.length }), s.pass((0, e._)`${f} <= ${o.length}`);
    else if (typeof l == "object" && !(0, t.alwaysValidSchema)(y, l)) {
      const $ = i.var("valid", (0, e._)`${f} <= ${o.length}`);
      i.if((0, e.not)($), () => h($)), s.ok($);
    }
    function h($) {
      i.forRange("i", o.length, f, (_) => {
        s.subschema({ keyword: c, dataProp: _, dataPropType: t.Type.Num }, $), y.allErrors || i.if((0, e.not)($), () => i.break());
      });
    }
  }
  return Je.validateAdditionalItems = a, Je.default = n, Je;
}
var Xt = {}, Qe = {}, ja;
function Mi() {
  if (ja) return Qe;
  ja = 1, Object.defineProperty(Qe, "__esModule", { value: !0 }), Qe.validateTuple = void 0;
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ ee(), r = /* @__PURE__ */ Ie(), n = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "array", "boolean"],
    before: "uniqueItems",
    code(s) {
      const { schema: o, it: i } = s;
      if (Array.isArray(o))
        return a(s, "additionalItems", o);
      i.items = !0, !(0, t.alwaysValidSchema)(i, o) && s.ok((0, r.validateArray)(s));
    }
  };
  function a(s, o, i = s.schema) {
    const { gen: l, parentSchema: u, data: c, keyword: y, it: f } = s;
    _(u), f.opts.unevaluated && i.length && f.items !== !0 && (f.items = t.mergeEvaluated.items(l, i.length, f.items));
    const h = l.name("valid"), $ = l.const("len", (0, e._)`${c}.length`);
    i.forEach((p, v) => {
      (0, t.alwaysValidSchema)(f, p) || (l.if((0, e._)`${$} > ${v}`, () => s.subschema({
        keyword: y,
        schemaProp: v,
        dataProp: v
      }, h)), s.ok(h));
    });
    function _(p) {
      const { opts: v, errSchemaPath: d } = f, g = i.length, S = g === p.minItems && (g === p.maxItems || p[o] === !1);
      if (v.strictTuples && !S) {
        const m = `"${y}" is ${g}-tuple, but minItems or maxItems/${o} are not specified or different at path "${d}"`;
        (0, t.checkStrictMode)(f, m, v.strictTuples);
      }
    }
  }
  return Qe.validateTuple = a, Qe.default = n, Qe;
}
var ka;
function pu() {
  if (ka) return Xt;
  ka = 1, Object.defineProperty(Xt, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Mi(), t = {
    keyword: "prefixItems",
    type: "array",
    schemaType: ["array"],
    before: "uniqueItems",
    code: (r) => (0, e.validateTuple)(r, "items")
  };
  return Xt.default = t, Xt;
}
var Yt = {}, Ca;
function hu() {
  if (Ca) return Yt;
  Ca = 1, Object.defineProperty(Yt, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ ee(), r = /* @__PURE__ */ Ie(), n = /* @__PURE__ */ Li(), s = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    error: {
      message: ({ params: { len: o } }) => (0, e.str)`must NOT have more than ${o} items`,
      params: ({ params: { len: o } }) => (0, e._)`{limit: ${o}}`
    },
    code(o) {
      const { schema: i, parentSchema: l, it: u } = o, { prefixItems: c } = l;
      u.items = !0, !(0, t.alwaysValidSchema)(u, i) && (c ? (0, n.validateAdditionalItems)(o, c) : o.ok((0, r.validateArray)(o)));
    }
  };
  return Yt.default = s, Yt;
}
var Jt = {}, qa;
function mu() {
  if (qa) return Jt;
  qa = 1, Object.defineProperty(Jt, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ ee(), n = {
    keyword: "contains",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    trackErrors: !0,
    error: {
      message: ({ params: { min: a, max: s } }) => s === void 0 ? (0, e.str)`must contain at least ${a} valid item(s)` : (0, e.str)`must contain at least ${a} and no more than ${s} valid item(s)`,
      params: ({ params: { min: a, max: s } }) => s === void 0 ? (0, e._)`{minContains: ${a}}` : (0, e._)`{minContains: ${a}, maxContains: ${s}}`
    },
    code(a) {
      const { gen: s, schema: o, parentSchema: i, data: l, it: u } = a;
      let c, y;
      const { minContains: f, maxContains: h } = i;
      u.opts.next ? (c = f === void 0 ? 1 : f, y = h) : c = 1;
      const $ = s.const("len", (0, e._)`${l}.length`);
      if (a.setParams({ min: c, max: y }), y === void 0 && c === 0) {
        (0, t.checkStrictMode)(u, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
        return;
      }
      if (y !== void 0 && c > y) {
        (0, t.checkStrictMode)(u, '"minContains" > "maxContains" is always invalid'), a.fail();
        return;
      }
      if ((0, t.alwaysValidSchema)(u, o)) {
        let g = (0, e._)`${$} >= ${c}`;
        y !== void 0 && (g = (0, e._)`${g} && ${$} <= ${y}`), a.pass(g);
        return;
      }
      u.items = !0;
      const _ = s.name("valid");
      y === void 0 && c === 1 ? v(_, () => s.if(_, () => s.break())) : c === 0 ? (s.let(_, !0), y !== void 0 && s.if((0, e._)`${l}.length > 0`, p)) : (s.let(_, !1), p()), a.result(_, () => a.reset());
      function p() {
        const g = s.name("_valid"), S = s.let("count", 0);
        v(g, () => s.if(g, () => d(S)));
      }
      function v(g, S) {
        s.forRange("i", 0, $, (m) => {
          a.subschema({
            keyword: "contains",
            dataProp: m,
            dataPropType: t.Type.Num,
            compositeRule: !0
          }, g), S();
        });
      }
      function d(g) {
        s.code((0, e._)`${g}++`), y === void 0 ? s.if((0, e._)`${g} >= ${c}`, () => s.assign(_, !0).break()) : (s.if((0, e._)`${g} > ${y}`, () => s.assign(_, !1).break()), c === 1 ? s.assign(_, !0) : s.if((0, e._)`${g} >= ${c}`, () => s.assign(_, !0)));
      }
    }
  };
  return Jt.default = n, Jt;
}
var fn = {}, Da;
function Rs() {
  return Da || (Da = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.validateSchemaDeps = e.validatePropertyDeps = e.error = void 0;
    const t = /* @__PURE__ */ Y(), r = /* @__PURE__ */ ee(), n = /* @__PURE__ */ Ie();
    e.error = {
      message: ({ params: { property: l, depsCount: u, deps: c } }) => {
        const y = u === 1 ? "property" : "properties";
        return (0, t.str)`must have ${y} ${c} when property ${l} is present`;
      },
      params: ({ params: { property: l, depsCount: u, deps: c, missingProperty: y } }) => (0, t._)`{property: ${l},
    missingProperty: ${y},
    depsCount: ${u},
    deps: ${c}}`
      // TODO change to reference
    };
    const a = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: e.error,
      code(l) {
        const [u, c] = s(l);
        o(l, u), i(l, c);
      }
    };
    function s({ schema: l }) {
      const u = {}, c = {};
      for (const y in l) {
        if (y === "__proto__")
          continue;
        const f = Array.isArray(l[y]) ? u : c;
        f[y] = l[y];
      }
      return [u, c];
    }
    function o(l, u = l.schema) {
      const { gen: c, data: y, it: f } = l;
      if (Object.keys(u).length === 0)
        return;
      const h = c.let("missing");
      for (const $ in u) {
        const _ = u[$];
        if (_.length === 0)
          continue;
        const p = (0, n.propertyInData)(c, y, $, f.opts.ownProperties);
        l.setParams({
          property: $,
          depsCount: _.length,
          deps: _.join(", ")
        }), f.allErrors ? c.if(p, () => {
          for (const v of _)
            (0, n.checkReportMissingProp)(l, v);
        }) : (c.if((0, t._)`${p} && (${(0, n.checkMissingProp)(l, _, h)})`), (0, n.reportMissingProp)(l, h), c.else());
      }
    }
    e.validatePropertyDeps = o;
    function i(l, u = l.schema) {
      const { gen: c, data: y, keyword: f, it: h } = l, $ = c.name("valid");
      for (const _ in u)
        (0, r.alwaysValidSchema)(h, u[_]) || (c.if(
          (0, n.propertyInData)(c, y, _, h.opts.ownProperties),
          () => {
            const p = l.subschema({ keyword: f, schemaProp: _ }, $);
            l.mergeValidEvaluated(p, $);
          },
          () => c.var($, !0)
          // TODO var
        ), l.ok($));
    }
    e.validateSchemaDeps = i, e.default = a;
  })(fn)), fn;
}
var Qt = {}, La;
function yu() {
  if (La) return Qt;
  La = 1, Object.defineProperty(Qt, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ ee(), n = {
    keyword: "propertyNames",
    type: "object",
    schemaType: ["object", "boolean"],
    error: {
      message: "property name must be valid",
      params: ({ params: a }) => (0, e._)`{propertyName: ${a.propertyName}}`
    },
    code(a) {
      const { gen: s, schema: o, data: i, it: l } = a;
      if ((0, t.alwaysValidSchema)(l, o))
        return;
      const u = s.name("valid");
      s.forIn("key", i, (c) => {
        a.setParams({ propertyName: c }), a.subschema({
          keyword: "propertyNames",
          data: c,
          dataTypes: ["string"],
          propertyName: c,
          compositeRule: !0
        }, u), s.if((0, e.not)(u), () => {
          a.error(!0), l.allErrors || s.break();
        });
      }), a.ok(u);
    }
  };
  return Qt.default = n, Qt;
}
var Zt = {}, Ma;
function Ui() {
  if (Ma) return Zt;
  Ma = 1, Object.defineProperty(Zt, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Ie(), t = /* @__PURE__ */ Y(), r = /* @__PURE__ */ Pe(), n = /* @__PURE__ */ ee(), s = {
    keyword: "additionalProperties",
    type: ["object"],
    schemaType: ["boolean", "object"],
    allowUndefined: !0,
    trackErrors: !0,
    error: {
      message: "must NOT have additional properties",
      params: ({ params: o }) => (0, t._)`{additionalProperty: ${o.additionalProperty}}`
    },
    code(o) {
      const { gen: i, schema: l, parentSchema: u, data: c, errsCount: y, it: f } = o;
      if (!y)
        throw new Error("ajv implementation error");
      const { allErrors: h, opts: $ } = f;
      if (f.props = !0, $.removeAdditional !== "all" && (0, n.alwaysValidSchema)(f, l))
        return;
      const _ = (0, e.allSchemaProperties)(u.properties), p = (0, e.allSchemaProperties)(u.patternProperties);
      v(), o.ok((0, t._)`${y} === ${r.default.errors}`);
      function v() {
        i.forIn("key", c, (E) => {
          !_.length && !p.length ? S(E) : i.if(d(E), () => S(E));
        });
      }
      function d(E) {
        let b;
        if (_.length > 8) {
          const T = (0, n.schemaRefOrVal)(f, u.properties, "properties");
          b = (0, e.isOwnProperty)(i, T, E);
        } else _.length ? b = (0, t.or)(..._.map((T) => (0, t._)`${E} === ${T}`)) : b = t.nil;
        return p.length && (b = (0, t.or)(b, ...p.map((T) => (0, t._)`${(0, e.usePattern)(o, T)}.test(${E})`))), (0, t.not)(b);
      }
      function g(E) {
        i.code((0, t._)`delete ${c}[${E}]`);
      }
      function S(E) {
        if ($.removeAdditional === "all" || $.removeAdditional && l === !1) {
          g(E);
          return;
        }
        if (l === !1) {
          o.setParams({ additionalProperty: E }), o.error(), h || i.break();
          return;
        }
        if (typeof l == "object" && !(0, n.alwaysValidSchema)(f, l)) {
          const b = i.name("valid");
          $.removeAdditional === "failing" ? (m(E, b, !1), i.if((0, t.not)(b), () => {
            o.reset(), g(E);
          })) : (m(E, b), h || i.if((0, t.not)(b), () => i.break()));
        }
      }
      function m(E, b, T) {
        const M = {
          keyword: "additionalProperties",
          dataProp: E,
          dataPropType: n.Type.Str
        };
        T === !1 && Object.assign(M, {
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }), o.subschema(M, b);
      }
    }
  };
  return Zt.default = s, Zt;
}
var er = {}, Ua;
function gu() {
  if (Ua) return er;
  Ua = 1, Object.defineProperty(er, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ wt(), t = /* @__PURE__ */ Ie(), r = /* @__PURE__ */ ee(), n = /* @__PURE__ */ Ui(), a = {
    keyword: "properties",
    type: "object",
    schemaType: "object",
    code(s) {
      const { gen: o, schema: i, parentSchema: l, data: u, it: c } = s;
      c.opts.removeAdditional === "all" && l.additionalProperties === void 0 && n.default.code(new e.KeywordCxt(c, n.default, "additionalProperties"));
      const y = (0, t.allSchemaProperties)(i);
      for (const p of y)
        c.definedProperties.add(p);
      c.opts.unevaluated && y.length && c.props !== !0 && (c.props = r.mergeEvaluated.props(o, (0, r.toHash)(y), c.props));
      const f = y.filter((p) => !(0, r.alwaysValidSchema)(c, i[p]));
      if (f.length === 0)
        return;
      const h = o.name("valid");
      for (const p of f)
        $(p) ? _(p) : (o.if((0, t.propertyInData)(o, u, p, c.opts.ownProperties)), _(p), c.allErrors || o.else().var(h, !0), o.endIf()), s.it.definedProperties.add(p), s.ok(h);
      function $(p) {
        return c.opts.useDefaults && !c.compositeRule && i[p].default !== void 0;
      }
      function _(p) {
        s.subschema({
          keyword: "properties",
          schemaProp: p,
          dataProp: p
        }, h);
      }
    }
  };
  return er.default = a, er;
}
var tr = {}, Fa;
function vu() {
  if (Fa) return tr;
  Fa = 1, Object.defineProperty(tr, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Ie(), t = /* @__PURE__ */ Y(), r = /* @__PURE__ */ ee(), n = /* @__PURE__ */ ee(), a = {
    keyword: "patternProperties",
    type: "object",
    schemaType: "object",
    code(s) {
      const { gen: o, schema: i, data: l, parentSchema: u, it: c } = s, { opts: y } = c, f = (0, e.allSchemaProperties)(i), h = f.filter((S) => (0, r.alwaysValidSchema)(c, i[S]));
      if (f.length === 0 || h.length === f.length && (!c.opts.unevaluated || c.props === !0))
        return;
      const $ = y.strictSchema && !y.allowMatchingProperties && u.properties, _ = o.name("valid");
      c.props !== !0 && !(c.props instanceof t.Name) && (c.props = (0, n.evaluatedPropsToName)(o, c.props));
      const { props: p } = c;
      v();
      function v() {
        for (const S of f)
          $ && d(S), c.allErrors ? g(S) : (o.var(_, !0), g(S), o.if(_));
      }
      function d(S) {
        for (const m in $)
          new RegExp(S).test(m) && (0, r.checkStrictMode)(c, `property ${m} matches pattern ${S} (use allowMatchingProperties)`);
      }
      function g(S) {
        o.forIn("key", l, (m) => {
          o.if((0, t._)`${(0, e.usePattern)(s, S)}.test(${m})`, () => {
            const E = h.includes(S);
            E || s.subschema({
              keyword: "patternProperties",
              schemaProp: S,
              dataProp: m,
              dataPropType: n.Type.Str
            }, _), c.opts.unevaluated && p !== !0 ? o.assign((0, t._)`${p}[${m}]`, !0) : !E && !c.allErrors && o.if((0, t.not)(_), () => o.break());
          });
        });
      }
    }
  };
  return tr.default = a, tr;
}
var rr = {}, Va;
function _u() {
  if (Va) return rr;
  Va = 1, Object.defineProperty(rr, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ ee(), t = {
    keyword: "not",
    schemaType: ["object", "boolean"],
    trackErrors: !0,
    code(r) {
      const { gen: n, schema: a, it: s } = r;
      if ((0, e.alwaysValidSchema)(s, a)) {
        r.fail();
        return;
      }
      const o = n.name("valid");
      r.subschema({
        keyword: "not",
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }, o), r.failResult(o, () => r.reset(), () => r.error());
    },
    error: { message: "must NOT be valid" }
  };
  return rr.default = t, rr;
}
var nr = {}, za;
function $u() {
  if (za) return nr;
  za = 1, Object.defineProperty(nr, "__esModule", { value: !0 });
  const t = {
    keyword: "anyOf",
    schemaType: "array",
    trackErrors: !0,
    code: (/* @__PURE__ */ Ie()).validateUnion,
    error: { message: "must match a schema in anyOf" }
  };
  return nr.default = t, nr;
}
var sr = {}, Ga;
function Eu() {
  if (Ga) return sr;
  Ga = 1, Object.defineProperty(sr, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ ee(), n = {
    keyword: "oneOf",
    schemaType: "array",
    trackErrors: !0,
    error: {
      message: "must match exactly one schema in oneOf",
      params: ({ params: a }) => (0, e._)`{passingSchemas: ${a.passing}}`
    },
    code(a) {
      const { gen: s, schema: o, parentSchema: i, it: l } = a;
      if (!Array.isArray(o))
        throw new Error("ajv implementation error");
      if (l.opts.discriminator && i.discriminator)
        return;
      const u = o, c = s.let("valid", !1), y = s.let("passing", null), f = s.name("_valid");
      a.setParams({ passing: y }), s.block(h), a.result(c, () => a.reset(), () => a.error(!0));
      function h() {
        u.forEach(($, _) => {
          let p;
          (0, t.alwaysValidSchema)(l, $) ? s.var(f, !0) : p = a.subschema({
            keyword: "oneOf",
            schemaProp: _,
            compositeRule: !0
          }, f), _ > 0 && s.if((0, e._)`${f} && ${c}`).assign(c, !1).assign(y, (0, e._)`[${y}, ${_}]`).else(), s.if(f, () => {
            s.assign(c, !0), s.assign(y, _), p && a.mergeEvaluated(p, e.Name);
          });
        });
      }
    }
  };
  return sr.default = n, sr;
}
var ar = {}, xa;
function wu() {
  if (xa) return ar;
  xa = 1, Object.defineProperty(ar, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ ee(), t = {
    keyword: "allOf",
    schemaType: "array",
    code(r) {
      const { gen: n, schema: a, it: s } = r;
      if (!Array.isArray(a))
        throw new Error("ajv implementation error");
      const o = n.name("valid");
      a.forEach((i, l) => {
        if ((0, e.alwaysValidSchema)(s, i))
          return;
        const u = r.subschema({ keyword: "allOf", schemaProp: l }, o);
        r.ok(o), r.mergeEvaluated(u);
      });
    }
  };
  return ar.default = t, ar;
}
var or = {}, Ka;
function Su() {
  if (Ka) return or;
  Ka = 1, Object.defineProperty(or, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ ee(), n = {
    keyword: "if",
    schemaType: ["object", "boolean"],
    trackErrors: !0,
    error: {
      message: ({ params: s }) => (0, e.str)`must match "${s.ifClause}" schema`,
      params: ({ params: s }) => (0, e._)`{failingKeyword: ${s.ifClause}}`
    },
    code(s) {
      const { gen: o, parentSchema: i, it: l } = s;
      i.then === void 0 && i.else === void 0 && (0, t.checkStrictMode)(l, '"if" without "then" and "else" is ignored');
      const u = a(l, "then"), c = a(l, "else");
      if (!u && !c)
        return;
      const y = o.let("valid", !0), f = o.name("_valid");
      if (h(), s.reset(), u && c) {
        const _ = o.let("ifClause");
        s.setParams({ ifClause: _ }), o.if(f, $("then", _), $("else", _));
      } else u ? o.if(f, $("then")) : o.if((0, e.not)(f), $("else"));
      s.pass(y, () => s.error(!0));
      function h() {
        const _ = s.subschema({
          keyword: "if",
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }, f);
        s.mergeEvaluated(_);
      }
      function $(_, p) {
        return () => {
          const v = s.subschema({ keyword: _ }, f);
          o.assign(y, f), s.mergeValidEvaluated(v, y), p ? o.assign(p, (0, e._)`${_}`) : s.setParams({ ifClause: _ });
        };
      }
    }
  };
  function a(s, o) {
    const i = s.schema[o];
    return i !== void 0 && !(0, t.alwaysValidSchema)(s, i);
  }
  return or.default = n, or;
}
var ir = {}, Ha;
function bu() {
  if (Ha) return ir;
  Ha = 1, Object.defineProperty(ir, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ ee(), t = {
    keyword: ["then", "else"],
    schemaType: ["object", "boolean"],
    code({ keyword: r, parentSchema: n, it: a }) {
      n.if === void 0 && (0, e.checkStrictMode)(a, `"${r}" without "if" is ignored`);
    }
  };
  return ir.default = t, ir;
}
var Ba;
function Fi() {
  if (Ba) return Wt;
  Ba = 1, Object.defineProperty(Wt, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Li(), t = /* @__PURE__ */ pu(), r = /* @__PURE__ */ Mi(), n = /* @__PURE__ */ hu(), a = /* @__PURE__ */ mu(), s = /* @__PURE__ */ Rs(), o = /* @__PURE__ */ yu(), i = /* @__PURE__ */ Ui(), l = /* @__PURE__ */ gu(), u = /* @__PURE__ */ vu(), c = /* @__PURE__ */ _u(), y = /* @__PURE__ */ $u(), f = /* @__PURE__ */ Eu(), h = /* @__PURE__ */ wu(), $ = /* @__PURE__ */ Su(), _ = /* @__PURE__ */ bu();
  function p(v = !1) {
    const d = [
      // any
      c.default,
      y.default,
      f.default,
      h.default,
      $.default,
      _.default,
      // object
      o.default,
      i.default,
      s.default,
      l.default,
      u.default
    ];
    return v ? d.push(t.default, n.default) : d.push(e.default, r.default), d.push(a.default), d;
  }
  return Wt.default = p, Wt;
}
var cr = {}, Ze = {}, Wa;
function Vi() {
  if (Wa) return Ze;
  Wa = 1, Object.defineProperty(Ze, "__esModule", { value: !0 }), Ze.dynamicAnchor = void 0;
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ Pe(), r = /* @__PURE__ */ xr(), n = /* @__PURE__ */ Ss(), a = {
    keyword: "$dynamicAnchor",
    schemaType: "string",
    code: (i) => s(i, i.schema)
  };
  function s(i, l) {
    const { gen: u, it: c } = i;
    c.schemaEnv.root.dynamicAnchors[l] = !0;
    const y = (0, e._)`${t.default.dynamicAnchors}${(0, e.getProperty)(l)}`, f = c.errSchemaPath === "#" ? c.validateName : o(i);
    u.if((0, e._)`!${y}`, () => u.assign(y, f));
  }
  Ze.dynamicAnchor = s;
  function o(i) {
    const { schemaEnv: l, schema: u, self: c } = i.it, { root: y, baseId: f, localRefs: h, meta: $ } = l.root, { schemaId: _ } = c.opts, p = new r.SchemaEnv({ schema: u, schemaId: _, root: y, baseId: f, localRefs: h, meta: $ });
    return r.compileSchema.call(c, p), (0, n.getValidate)(i, p);
  }
  return Ze.default = a, Ze;
}
var et = {}, Xa;
function zi() {
  if (Xa) return et;
  Xa = 1, Object.defineProperty(et, "__esModule", { value: !0 }), et.dynamicRef = void 0;
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ Pe(), r = /* @__PURE__ */ Ss(), n = {
    keyword: "$dynamicRef",
    schemaType: "string",
    code: (s) => a(s, s.schema)
  };
  function a(s, o) {
    const { gen: i, keyword: l, it: u } = s;
    if (o[0] !== "#")
      throw new Error(`"${l}" only supports hash fragment reference`);
    const c = o.slice(1);
    if (u.allErrors)
      y();
    else {
      const h = i.let("valid", !1);
      y(h), s.ok(h);
    }
    function y(h) {
      if (u.schemaEnv.root.dynamicAnchors[c]) {
        const $ = i.let("_v", (0, e._)`${t.default.dynamicAnchors}${(0, e.getProperty)(c)}`);
        i.if($, f($, h), f(u.validateName, h));
      } else
        f(u.validateName, h)();
    }
    function f(h, $) {
      return $ ? () => i.block(() => {
        (0, r.callRef)(s, h), i.let($, !0);
      }) : () => (0, r.callRef)(s, h);
    }
  }
  return et.dynamicRef = a, et.default = n, et;
}
var ur = {}, Ya;
function Ru() {
  if (Ya) return ur;
  Ya = 1, Object.defineProperty(ur, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Vi(), t = /* @__PURE__ */ ee(), r = {
    keyword: "$recursiveAnchor",
    schemaType: "boolean",
    code(n) {
      n.schema ? (0, e.dynamicAnchor)(n, "") : (0, t.checkStrictMode)(n.it, "$recursiveAnchor: false is ignored");
    }
  };
  return ur.default = r, ur;
}
var lr = {}, Ja;
function Pu() {
  if (Ja) return lr;
  Ja = 1, Object.defineProperty(lr, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ zi(), t = {
    keyword: "$recursiveRef",
    schemaType: "string",
    code: (r) => (0, e.dynamicRef)(r, r.schema)
  };
  return lr.default = t, lr;
}
var Qa;
function Iu() {
  if (Qa) return cr;
  Qa = 1, Object.defineProperty(cr, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Vi(), t = /* @__PURE__ */ zi(), r = /* @__PURE__ */ Ru(), n = /* @__PURE__ */ Pu(), a = [e.default, t.default, r.default, n.default];
  return cr.default = a, cr;
}
var dr = {}, fr = {}, Za;
function Ou() {
  if (Za) return fr;
  Za = 1, Object.defineProperty(fr, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Rs(), t = {
    keyword: "dependentRequired",
    type: "object",
    schemaType: "object",
    error: e.error,
    code: (r) => (0, e.validatePropertyDeps)(r)
  };
  return fr.default = t, fr;
}
var pr = {}, eo;
function Tu() {
  if (eo) return pr;
  eo = 1, Object.defineProperty(pr, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Rs(), t = {
    keyword: "dependentSchemas",
    type: "object",
    schemaType: "object",
    code: (r) => (0, e.validateSchemaDeps)(r)
  };
  return pr.default = t, pr;
}
var hr = {}, to;
function Nu() {
  if (to) return hr;
  to = 1, Object.defineProperty(hr, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ ee(), t = {
    keyword: ["maxContains", "minContains"],
    type: "array",
    schemaType: "number",
    code({ keyword: r, parentSchema: n, it: a }) {
      n.contains === void 0 && (0, e.checkStrictMode)(a, `"${r}" without "contains" is ignored`);
    }
  };
  return hr.default = t, hr;
}
var ro;
function Au() {
  if (ro) return dr;
  ro = 1, Object.defineProperty(dr, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Ou(), t = /* @__PURE__ */ Tu(), r = /* @__PURE__ */ Nu(), n = [e.default, t.default, r.default];
  return dr.default = n, dr;
}
var mr = {}, yr = {}, no;
function ju() {
  if (no) return yr;
  no = 1, Object.defineProperty(yr, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ ee(), r = /* @__PURE__ */ Pe(), a = {
    keyword: "unevaluatedProperties",
    type: "object",
    schemaType: ["boolean", "object"],
    trackErrors: !0,
    error: {
      message: "must NOT have unevaluated properties",
      params: ({ params: s }) => (0, e._)`{unevaluatedProperty: ${s.unevaluatedProperty}}`
    },
    code(s) {
      const { gen: o, schema: i, data: l, errsCount: u, it: c } = s;
      if (!u)
        throw new Error("ajv implementation error");
      const { allErrors: y, props: f } = c;
      f instanceof e.Name ? o.if((0, e._)`${f} !== true`, () => o.forIn("key", l, (p) => o.if($(f, p), () => h(p)))) : f !== !0 && o.forIn("key", l, (p) => f === void 0 ? h(p) : o.if(_(f, p), () => h(p))), c.props = !0, s.ok((0, e._)`${u} === ${r.default.errors}`);
      function h(p) {
        if (i === !1) {
          s.setParams({ unevaluatedProperty: p }), s.error(), y || o.break();
          return;
        }
        if (!(0, t.alwaysValidSchema)(c, i)) {
          const v = o.name("valid");
          s.subschema({
            keyword: "unevaluatedProperties",
            dataProp: p,
            dataPropType: t.Type.Str
          }, v), y || o.if((0, e.not)(v), () => o.break());
        }
      }
      function $(p, v) {
        return (0, e._)`!${p} || !${p}[${v}]`;
      }
      function _(p, v) {
        const d = [];
        for (const g in p)
          p[g] === !0 && d.push((0, e._)`${v} !== ${g}`);
        return (0, e.and)(...d);
      }
    }
  };
  return yr.default = a, yr;
}
var gr = {}, so;
function ku() {
  if (so) return gr;
  so = 1, Object.defineProperty(gr, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ ee(), n = {
    keyword: "unevaluatedItems",
    type: "array",
    schemaType: ["boolean", "object"],
    error: {
      message: ({ params: { len: a } }) => (0, e.str)`must NOT have more than ${a} items`,
      params: ({ params: { len: a } }) => (0, e._)`{limit: ${a}}`
    },
    code(a) {
      const { gen: s, schema: o, data: i, it: l } = a, u = l.items || 0;
      if (u === !0)
        return;
      const c = s.const("len", (0, e._)`${i}.length`);
      if (o === !1)
        a.setParams({ len: u }), a.fail((0, e._)`${c} > ${u}`);
      else if (typeof o == "object" && !(0, t.alwaysValidSchema)(l, o)) {
        const f = s.var("valid", (0, e._)`${c} <= ${u}`);
        s.if((0, e.not)(f), () => y(f, u)), a.ok(f);
      }
      l.items = !0;
      function y(f, h) {
        s.forRange("i", h, c, ($) => {
          a.subschema({ keyword: "unevaluatedItems", dataProp: $, dataPropType: t.Type.Num }, f), l.allErrors || s.if((0, e.not)(f), () => s.break());
        });
      }
    }
  };
  return gr.default = n, gr;
}
var ao;
function Cu() {
  if (ao) return mr;
  ao = 1, Object.defineProperty(mr, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ ju(), t = /* @__PURE__ */ ku(), r = [e.default, t.default];
  return mr.default = r, mr;
}
var vr = {}, _r = {}, oo;
function qu() {
  if (oo) return _r;
  oo = 1, Object.defineProperty(_r, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Y(), r = {
    keyword: "format",
    type: ["number", "string"],
    schemaType: "string",
    $data: !0,
    error: {
      message: ({ schemaCode: n }) => (0, e.str)`must match format "${n}"`,
      params: ({ schemaCode: n }) => (0, e._)`{format: ${n}}`
    },
    code(n, a) {
      const { gen: s, data: o, $data: i, schema: l, schemaCode: u, it: c } = n, { opts: y, errSchemaPath: f, schemaEnv: h, self: $ } = c;
      if (!y.validateFormats)
        return;
      i ? _() : p();
      function _() {
        const v = s.scopeValue("formats", {
          ref: $.formats,
          code: y.code.formats
        }), d = s.const("fDef", (0, e._)`${v}[${u}]`), g = s.let("fType"), S = s.let("format");
        s.if((0, e._)`typeof ${d} == "object" && !(${d} instanceof RegExp)`, () => s.assign(g, (0, e._)`${d}.type || "string"`).assign(S, (0, e._)`${d}.validate`), () => s.assign(g, (0, e._)`"string"`).assign(S, d)), n.fail$data((0, e.or)(m(), E()));
        function m() {
          return y.strictSchema === !1 ? e.nil : (0, e._)`${u} && !${S}`;
        }
        function E() {
          const b = h.$async ? (0, e._)`(${d}.async ? await ${S}(${o}) : ${S}(${o}))` : (0, e._)`${S}(${o})`, T = (0, e._)`(typeof ${S} == "function" ? ${b} : ${S}.test(${o}))`;
          return (0, e._)`${S} && ${S} !== true && ${g} === ${a} && !${T}`;
        }
      }
      function p() {
        const v = $.formats[l];
        if (!v) {
          m();
          return;
        }
        if (v === !0)
          return;
        const [d, g, S] = E(v);
        d === a && n.pass(b());
        function m() {
          if (y.strictSchema === !1) {
            $.logger.warn(T());
            return;
          }
          throw new Error(T());
          function T() {
            return `unknown format "${l}" ignored in schema at path "${f}"`;
          }
        }
        function E(T) {
          const M = T instanceof RegExp ? (0, e.regexpCode)(T) : y.code.formats ? (0, e._)`${y.code.formats}${(0, e.getProperty)(l)}` : void 0, z = s.scopeValue("formats", { key: l, ref: T, code: M });
          return typeof T == "object" && !(T instanceof RegExp) ? [T.type || "string", T.validate, (0, e._)`${z}.validate`] : ["string", T, z];
        }
        function b() {
          if (typeof v == "object" && !(v instanceof RegExp) && v.async) {
            if (!h.$async)
              throw new Error("async format in sync schema");
            return (0, e._)`await ${S}(${o})`;
          }
          return typeof g == "function" ? (0, e._)`${S}(${o})` : (0, e._)`${S}.test(${o})`;
        }
      }
    }
  };
  return _r.default = r, _r;
}
var io;
function Gi() {
  if (io) return vr;
  io = 1, Object.defineProperty(vr, "__esModule", { value: !0 });
  const t = [(/* @__PURE__ */ qu()).default];
  return vr.default = t, vr;
}
var We = {}, co;
function xi() {
  return co || (co = 1, Object.defineProperty(We, "__esModule", { value: !0 }), We.contentVocabulary = We.metadataVocabulary = void 0, We.metadataVocabulary = [
    "title",
    "description",
    "default",
    "deprecated",
    "readOnly",
    "writeOnly",
    "examples"
  ], We.contentVocabulary = [
    "contentMediaType",
    "contentEncoding",
    "contentSchema"
  ]), We;
}
var uo;
function Du() {
  if (uo) return jt;
  uo = 1, Object.defineProperty(jt, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ qi(), t = /* @__PURE__ */ Di(), r = /* @__PURE__ */ Fi(), n = /* @__PURE__ */ Iu(), a = /* @__PURE__ */ Au(), s = /* @__PURE__ */ Cu(), o = /* @__PURE__ */ Gi(), i = /* @__PURE__ */ xi(), l = [
    n.default,
    e.default,
    t.default,
    (0, r.default)(!0),
    o.default,
    i.metadataVocabulary,
    i.contentVocabulary,
    a.default,
    s.default
  ];
  return jt.default = l, jt;
}
var $r = {}, yt = {}, lo;
function Lu() {
  if (lo) return yt;
  lo = 1, Object.defineProperty(yt, "__esModule", { value: !0 }), yt.DiscrError = void 0;
  var e;
  return (function(t) {
    t.Tag = "tag", t.Mapping = "mapping";
  })(e || (yt.DiscrError = e = {})), yt;
}
var fo;
function Ki() {
  if (fo) return $r;
  fo = 1, Object.defineProperty($r, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ Y(), t = /* @__PURE__ */ Lu(), r = /* @__PURE__ */ xr(), n = /* @__PURE__ */ St(), a = /* @__PURE__ */ ee(), o = {
    keyword: "discriminator",
    type: "object",
    schemaType: "object",
    error: {
      message: ({ params: { discrError: i, tagName: l } }) => i === t.DiscrError.Tag ? `tag "${l}" must be string` : `value of tag "${l}" must be in oneOf`,
      params: ({ params: { discrError: i, tag: l, tagName: u } }) => (0, e._)`{error: ${i}, tag: ${u}, tagValue: ${l}}`
    },
    code(i) {
      const { gen: l, data: u, schema: c, parentSchema: y, it: f } = i, { oneOf: h } = y;
      if (!f.opts.discriminator)
        throw new Error("discriminator: requires discriminator option");
      const $ = c.propertyName;
      if (typeof $ != "string")
        throw new Error("discriminator: requires propertyName");
      if (c.mapping)
        throw new Error("discriminator: mapping is not supported");
      if (!h)
        throw new Error("discriminator: requires oneOf keyword");
      const _ = l.let("valid", !1), p = l.const("tag", (0, e._)`${u}${(0, e.getProperty)($)}`);
      l.if((0, e._)`typeof ${p} == "string"`, () => v(), () => i.error(!1, { discrError: t.DiscrError.Tag, tag: p, tagName: $ })), i.ok(_);
      function v() {
        const S = g();
        l.if(!1);
        for (const m in S)
          l.elseIf((0, e._)`${p} === ${m}`), l.assign(_, d(S[m]));
        l.else(), i.error(!1, { discrError: t.DiscrError.Mapping, tag: p, tagName: $ }), l.endIf();
      }
      function d(S) {
        const m = l.name("valid"), E = i.subschema({ keyword: "oneOf", schemaProp: S }, m);
        return i.mergeEvaluated(E, e.Name), m;
      }
      function g() {
        var S;
        const m = {}, E = T(y);
        let b = !0;
        for (let q = 0; q < h.length; q++) {
          let F = h[q];
          if (F?.$ref && !(0, a.schemaHasRulesButRef)(F, f.self.RULES)) {
            const j = F.$ref;
            if (F = r.resolveRef.call(f.self, f.schemaEnv.root, f.baseId, j), F instanceof r.SchemaEnv && (F = F.schema), F === void 0)
              throw new n.default(f.opts.uriResolver, f.baseId, j);
          }
          const G = (S = F?.properties) === null || S === void 0 ? void 0 : S[$];
          if (typeof G != "object")
            throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${$}"`);
          b = b && (E || T(F)), M(G, q);
        }
        if (!b)
          throw new Error(`discriminator: "${$}" must be required`);
        return m;
        function T({ required: q }) {
          return Array.isArray(q) && q.includes($);
        }
        function M(q, F) {
          if (q.const)
            z(q.const, F);
          else if (q.enum)
            for (const G of q.enum)
              z(G, F);
          else
            throw new Error(`discriminator: "properties/${$}" must have "const" or "enum"`);
        }
        function z(q, F) {
          if (typeof q != "string" || q in m)
            throw new Error(`discriminator: "${$}" values must be unique strings`);
          m[q] = F;
        }
      }
    }
  };
  return $r.default = o, $r;
}
var Er = {};
const Mu = "https://json-schema.org/draft/2020-12/schema", Uu = "https://json-schema.org/draft/2020-12/schema", Fu = { "https://json-schema.org/draft/2020-12/vocab/core": !0, "https://json-schema.org/draft/2020-12/vocab/applicator": !0, "https://json-schema.org/draft/2020-12/vocab/unevaluated": !0, "https://json-schema.org/draft/2020-12/vocab/validation": !0, "https://json-schema.org/draft/2020-12/vocab/meta-data": !0, "https://json-schema.org/draft/2020-12/vocab/format-annotation": !0, "https://json-schema.org/draft/2020-12/vocab/content": !0 }, Vu = "meta", zu = "Core and Validation specifications meta-schema", Gu = [{ $ref: "meta/core" }, { $ref: "meta/applicator" }, { $ref: "meta/unevaluated" }, { $ref: "meta/validation" }, { $ref: "meta/meta-data" }, { $ref: "meta/format-annotation" }, { $ref: "meta/content" }], xu = ["object", "boolean"], Ku = "This meta-schema also defines keywords that have appeared in previous drafts in order to prevent incompatible extensions as they remain in common use.", Hu = { definitions: { $comment: '"definitions" has been replaced by "$defs".', type: "object", additionalProperties: { $dynamicRef: "#meta" }, deprecated: !0, default: {} }, dependencies: { $comment: '"dependencies" has been split and replaced by "dependentSchemas" and "dependentRequired" in order to serve their differing semantics.', type: "object", additionalProperties: { anyOf: [{ $dynamicRef: "#meta" }, { $ref: "meta/validation#/$defs/stringArray" }] }, deprecated: !0, default: {} }, $recursiveAnchor: { $comment: '"$recursiveAnchor" has been replaced by "$dynamicAnchor".', $ref: "meta/core#/$defs/anchorString", deprecated: !0 }, $recursiveRef: { $comment: '"$recursiveRef" has been replaced by "$dynamicRef".', $ref: "meta/core#/$defs/uriReferenceString", deprecated: !0 } }, Bu = {
  $schema: Mu,
  $id: Uu,
  $vocabulary: Fu,
  $dynamicAnchor: Vu,
  title: zu,
  allOf: Gu,
  type: xu,
  $comment: Ku,
  properties: Hu
}, Wu = "https://json-schema.org/draft/2020-12/schema", Xu = "https://json-schema.org/draft/2020-12/meta/applicator", Yu = { "https://json-schema.org/draft/2020-12/vocab/applicator": !0 }, Ju = "meta", Qu = "Applicator vocabulary meta-schema", Zu = ["object", "boolean"], el = { prefixItems: { $ref: "#/$defs/schemaArray" }, items: { $dynamicRef: "#meta" }, contains: { $dynamicRef: "#meta" }, additionalProperties: { $dynamicRef: "#meta" }, properties: { type: "object", additionalProperties: { $dynamicRef: "#meta" }, default: {} }, patternProperties: { type: "object", additionalProperties: { $dynamicRef: "#meta" }, propertyNames: { format: "regex" }, default: {} }, dependentSchemas: { type: "object", additionalProperties: { $dynamicRef: "#meta" }, default: {} }, propertyNames: { $dynamicRef: "#meta" }, if: { $dynamicRef: "#meta" }, then: { $dynamicRef: "#meta" }, else: { $dynamicRef: "#meta" }, allOf: { $ref: "#/$defs/schemaArray" }, anyOf: { $ref: "#/$defs/schemaArray" }, oneOf: { $ref: "#/$defs/schemaArray" }, not: { $dynamicRef: "#meta" } }, tl = { schemaArray: { type: "array", minItems: 1, items: { $dynamicRef: "#meta" } } }, rl = {
  $schema: Wu,
  $id: Xu,
  $vocabulary: Yu,
  $dynamicAnchor: Ju,
  title: Qu,
  type: Zu,
  properties: el,
  $defs: tl
}, nl = "https://json-schema.org/draft/2020-12/schema", sl = "https://json-schema.org/draft/2020-12/meta/unevaluated", al = { "https://json-schema.org/draft/2020-12/vocab/unevaluated": !0 }, ol = "meta", il = "Unevaluated applicator vocabulary meta-schema", cl = ["object", "boolean"], ul = { unevaluatedItems: { $dynamicRef: "#meta" }, unevaluatedProperties: { $dynamicRef: "#meta" } }, ll = {
  $schema: nl,
  $id: sl,
  $vocabulary: al,
  $dynamicAnchor: ol,
  title: il,
  type: cl,
  properties: ul
}, dl = "https://json-schema.org/draft/2020-12/schema", fl = "https://json-schema.org/draft/2020-12/meta/content", pl = { "https://json-schema.org/draft/2020-12/vocab/content": !0 }, hl = "meta", ml = "Content vocabulary meta-schema", yl = ["object", "boolean"], gl = { contentEncoding: { type: "string" }, contentMediaType: { type: "string" }, contentSchema: { $dynamicRef: "#meta" } }, vl = {
  $schema: dl,
  $id: fl,
  $vocabulary: pl,
  $dynamicAnchor: hl,
  title: ml,
  type: yl,
  properties: gl
}, _l = "https://json-schema.org/draft/2020-12/schema", $l = "https://json-schema.org/draft/2020-12/meta/core", El = { "https://json-schema.org/draft/2020-12/vocab/core": !0 }, wl = "meta", Sl = "Core vocabulary meta-schema", bl = ["object", "boolean"], Rl = { $id: { $ref: "#/$defs/uriReferenceString", $comment: "Non-empty fragments not allowed.", pattern: "^[^#]*#?$" }, $schema: { $ref: "#/$defs/uriString" }, $ref: { $ref: "#/$defs/uriReferenceString" }, $anchor: { $ref: "#/$defs/anchorString" }, $dynamicRef: { $ref: "#/$defs/uriReferenceString" }, $dynamicAnchor: { $ref: "#/$defs/anchorString" }, $vocabulary: { type: "object", propertyNames: { $ref: "#/$defs/uriString" }, additionalProperties: { type: "boolean" } }, $comment: { type: "string" }, $defs: { type: "object", additionalProperties: { $dynamicRef: "#meta" } } }, Pl = { anchorString: { type: "string", pattern: "^[A-Za-z_][-A-Za-z0-9._]*$" }, uriString: { type: "string", format: "uri" }, uriReferenceString: { type: "string", format: "uri-reference" } }, Il = {
  $schema: _l,
  $id: $l,
  $vocabulary: El,
  $dynamicAnchor: wl,
  title: Sl,
  type: bl,
  properties: Rl,
  $defs: Pl
}, Ol = "https://json-schema.org/draft/2020-12/schema", Tl = "https://json-schema.org/draft/2020-12/meta/format-annotation", Nl = { "https://json-schema.org/draft/2020-12/vocab/format-annotation": !0 }, Al = "meta", jl = "Format vocabulary meta-schema for annotation results", kl = ["object", "boolean"], Cl = { format: { type: "string" } }, ql = {
  $schema: Ol,
  $id: Tl,
  $vocabulary: Nl,
  $dynamicAnchor: Al,
  title: jl,
  type: kl,
  properties: Cl
}, Dl = "https://json-schema.org/draft/2020-12/schema", Ll = "https://json-schema.org/draft/2020-12/meta/meta-data", Ml = { "https://json-schema.org/draft/2020-12/vocab/meta-data": !0 }, Ul = "meta", Fl = "Meta-data vocabulary meta-schema", Vl = ["object", "boolean"], zl = { title: { type: "string" }, description: { type: "string" }, default: !0, deprecated: { type: "boolean", default: !1 }, readOnly: { type: "boolean", default: !1 }, writeOnly: { type: "boolean", default: !1 }, examples: { type: "array", items: !0 } }, Gl = {
  $schema: Dl,
  $id: Ll,
  $vocabulary: Ml,
  $dynamicAnchor: Ul,
  title: Fl,
  type: Vl,
  properties: zl
}, xl = "https://json-schema.org/draft/2020-12/schema", Kl = "https://json-schema.org/draft/2020-12/meta/validation", Hl = { "https://json-schema.org/draft/2020-12/vocab/validation": !0 }, Bl = "meta", Wl = "Validation vocabulary meta-schema", Xl = ["object", "boolean"], Yl = { type: { anyOf: [{ $ref: "#/$defs/simpleTypes" }, { type: "array", items: { $ref: "#/$defs/simpleTypes" }, minItems: 1, uniqueItems: !0 }] }, const: !0, enum: { type: "array", items: !0 }, multipleOf: { type: "number", exclusiveMinimum: 0 }, maximum: { type: "number" }, exclusiveMaximum: { type: "number" }, minimum: { type: "number" }, exclusiveMinimum: { type: "number" }, maxLength: { $ref: "#/$defs/nonNegativeInteger" }, minLength: { $ref: "#/$defs/nonNegativeIntegerDefault0" }, pattern: { type: "string", format: "regex" }, maxItems: { $ref: "#/$defs/nonNegativeInteger" }, minItems: { $ref: "#/$defs/nonNegativeIntegerDefault0" }, uniqueItems: { type: "boolean", default: !1 }, maxContains: { $ref: "#/$defs/nonNegativeInteger" }, minContains: { $ref: "#/$defs/nonNegativeInteger", default: 1 }, maxProperties: { $ref: "#/$defs/nonNegativeInteger" }, minProperties: { $ref: "#/$defs/nonNegativeIntegerDefault0" }, required: { $ref: "#/$defs/stringArray" }, dependentRequired: { type: "object", additionalProperties: { $ref: "#/$defs/stringArray" } } }, Jl = { nonNegativeInteger: { type: "integer", minimum: 0 }, nonNegativeIntegerDefault0: { $ref: "#/$defs/nonNegativeInteger", default: 0 }, simpleTypes: { enum: ["array", "boolean", "integer", "null", "number", "object", "string"] }, stringArray: { type: "array", items: { type: "string" }, uniqueItems: !0, default: [] } }, Ql = {
  $schema: xl,
  $id: Kl,
  $vocabulary: Hl,
  $dynamicAnchor: Bl,
  title: Wl,
  type: Xl,
  properties: Yl,
  $defs: Jl
};
var po;
function Zl() {
  if (po) return Er;
  po = 1, Object.defineProperty(Er, "__esModule", { value: !0 });
  const e = Bu, t = rl, r = ll, n = vl, a = Il, s = ql, o = Gl, i = Ql, l = ["/properties"];
  function u(c) {
    return [
      e,
      t,
      r,
      n,
      a,
      y(this, s),
      o,
      y(this, i)
    ].forEach((f) => this.addMetaSchema(f, void 0, !1)), this;
    function y(f, h) {
      return c ? f.$dataMetaSchema(h, l) : h;
    }
  }
  return Er.default = u, Er;
}
var ho;
function ed() {
  return ho || (ho = 1, (function(e, t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.MissingRefError = t.ValidationError = t.CodeGen = t.Name = t.nil = t.stringify = t.str = t._ = t.KeywordCxt = t.Ajv2020 = void 0;
    const r = /* @__PURE__ */ Ci(), n = /* @__PURE__ */ Du(), a = /* @__PURE__ */ Ki(), s = /* @__PURE__ */ Zl(), o = "https://json-schema.org/draft/2020-12/schema";
    class i extends r.default {
      constructor(h = {}) {
        super({
          ...h,
          dynamicRef: !0,
          next: !0,
          unevaluated: !0
        });
      }
      _addVocabularies() {
        super._addVocabularies(), n.default.forEach((h) => this.addVocabulary(h)), this.opts.discriminator && this.addKeyword(a.default);
      }
      _addDefaultMetaSchema() {
        super._addDefaultMetaSchema();
        const { $data: h, meta: $ } = this.opts;
        $ && (s.default.call(this, h), this.refs["http://json-schema.org/schema"] = o);
      }
      defaultMeta() {
        return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(o) ? o : void 0);
      }
    }
    t.Ajv2020 = i, e.exports = t = i, e.exports.Ajv2020 = i, Object.defineProperty(t, "__esModule", { value: !0 }), t.default = i;
    var l = /* @__PURE__ */ wt();
    Object.defineProperty(t, "KeywordCxt", { enumerable: !0, get: function() {
      return l.KeywordCxt;
    } });
    var u = /* @__PURE__ */ Y();
    Object.defineProperty(t, "_", { enumerable: !0, get: function() {
      return u._;
    } }), Object.defineProperty(t, "str", { enumerable: !0, get: function() {
      return u.str;
    } }), Object.defineProperty(t, "stringify", { enumerable: !0, get: function() {
      return u.stringify;
    } }), Object.defineProperty(t, "nil", { enumerable: !0, get: function() {
      return u.nil;
    } }), Object.defineProperty(t, "Name", { enumerable: !0, get: function() {
      return u.Name;
    } }), Object.defineProperty(t, "CodeGen", { enumerable: !0, get: function() {
      return u.CodeGen;
    } });
    var c = /* @__PURE__ */ Gr();
    Object.defineProperty(t, "ValidationError", { enumerable: !0, get: function() {
      return c.default;
    } });
    var y = /* @__PURE__ */ St();
    Object.defineProperty(t, "MissingRefError", { enumerable: !0, get: function() {
      return y.default;
    } });
  })(It, It.exports)), It.exports;
}
var td = /* @__PURE__ */ ed(), wr = { exports: {} }, pn = {}, mo;
function rd() {
  return mo || (mo = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.formatNames = e.fastFormats = e.fullFormats = void 0;
    function t(q, F) {
      return { validate: q, compare: F };
    }
    e.fullFormats = {
      // date: http://tools.ietf.org/html/rfc3339#section-5.6
      date: t(s, o),
      // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
      time: t(l(!0), u),
      "date-time": t(f(!0), h),
      "iso-time": t(l(), c),
      "iso-date-time": t(f(), $),
      // duration: https://tools.ietf.org/html/rfc3339#appendix-A
      duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
      uri: v,
      "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
      // uri-template: https://tools.ietf.org/html/rfc6570
      "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
      // For the source: https://gist.github.com/dperini/729294
      // For test cases: https://mathiasbynens.be/demo/url-regex
      url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
      email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
      hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
      // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
      ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
      ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
      regex: z,
      // uuid: http://tools.ietf.org/html/rfc4122
      uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
      // JSON-pointer: https://tools.ietf.org/html/rfc6901
      // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
      "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
      "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
      // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
      "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
      // the following formats are used by the openapi specification: https://spec.openapis.org/oas/v3.0.0#data-types
      // byte: https://github.com/miguelmota/is-base64
      byte: g,
      // signed 32 bit integer
      int32: { type: "number", validate: E },
      // signed 64 bit integer
      int64: { type: "number", validate: b },
      // C-type float
      float: { type: "number", validate: T },
      // C-type double
      double: { type: "number", validate: T },
      // hint to the UI to hide input strings
      password: !0,
      // unchecked string payload
      binary: !0
    }, e.fastFormats = {
      ...e.fullFormats,
      date: t(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, o),
      time: t(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, u),
      "date-time": t(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, h),
      "iso-time": t(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, c),
      "iso-date-time": t(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, $),
      // uri: https://github.com/mafintosh/is-my-json-valid/blob/master/formats.js
      uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
      "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
      // email (sources from jsen validator):
      // http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address#answer-8829363
      // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'wilful violation')
      email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
    }, e.formatNames = Object.keys(e.fullFormats);
    function r(q) {
      return q % 4 === 0 && (q % 100 !== 0 || q % 400 === 0);
    }
    const n = /^(\d\d\d\d)-(\d\d)-(\d\d)$/, a = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function s(q) {
      const F = n.exec(q);
      if (!F)
        return !1;
      const G = +F[1], j = +F[2], D = +F[3];
      return j >= 1 && j <= 12 && D >= 1 && D <= (j === 2 && r(G) ? 29 : a[j]);
    }
    function o(q, F) {
      if (q && F)
        return q > F ? 1 : q < F ? -1 : 0;
    }
    const i = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
    function l(q) {
      return function(G) {
        const j = i.exec(G);
        if (!j)
          return !1;
        const D = +j[1], H = +j[2], x = +j[3], V = j[4], K = j[5] === "-" ? -1 : 1, k = +(j[6] || 0), P = +(j[7] || 0);
        if (k > 23 || P > 59 || q && !V)
          return !1;
        if (D <= 23 && H <= 59 && x < 60)
          return !0;
        const A = H - P * K, I = D - k * K - (A < 0 ? 1 : 0);
        return (I === 23 || I === -1) && (A === 59 || A === -1) && x < 61;
      };
    }
    function u(q, F) {
      if (!(q && F))
        return;
      const G = (/* @__PURE__ */ new Date("2020-01-01T" + q)).valueOf(), j = (/* @__PURE__ */ new Date("2020-01-01T" + F)).valueOf();
      if (G && j)
        return G - j;
    }
    function c(q, F) {
      if (!(q && F))
        return;
      const G = i.exec(q), j = i.exec(F);
      if (G && j)
        return q = G[1] + G[2] + G[3], F = j[1] + j[2] + j[3], q > F ? 1 : q < F ? -1 : 0;
    }
    const y = /t|\s/i;
    function f(q) {
      const F = l(q);
      return function(j) {
        const D = j.split(y);
        return D.length === 2 && s(D[0]) && F(D[1]);
      };
    }
    function h(q, F) {
      if (!(q && F))
        return;
      const G = new Date(q).valueOf(), j = new Date(F).valueOf();
      if (G && j)
        return G - j;
    }
    function $(q, F) {
      if (!(q && F))
        return;
      const [G, j] = q.split(y), [D, H] = F.split(y), x = o(G, D);
      if (x !== void 0)
        return x || u(j, H);
    }
    const _ = /\/|:/, p = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
    function v(q) {
      return _.test(q) && p.test(q);
    }
    const d = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
    function g(q) {
      return d.lastIndex = 0, d.test(q);
    }
    const S = -2147483648, m = 2 ** 31 - 1;
    function E(q) {
      return Number.isInteger(q) && q <= m && q >= S;
    }
    function b(q) {
      return Number.isInteger(q);
    }
    function T() {
      return !0;
    }
    const M = /[^\\]\\Z/;
    function z(q) {
      if (M.test(q))
        return !1;
      try {
        return new RegExp(q), !0;
      } catch {
        return !1;
      }
    }
  })(pn)), pn;
}
var hn = {}, Sr = { exports: {} }, br = {}, yo;
function nd() {
  if (yo) return br;
  yo = 1, Object.defineProperty(br, "__esModule", { value: !0 });
  const e = /* @__PURE__ */ qi(), t = /* @__PURE__ */ Di(), r = /* @__PURE__ */ Fi(), n = /* @__PURE__ */ Gi(), a = /* @__PURE__ */ xi(), s = [
    e.default,
    t.default,
    (0, r.default)(),
    n.default,
    a.metadataVocabulary,
    a.contentVocabulary
  ];
  return br.default = s, br;
}
const sd = "http://json-schema.org/draft-07/schema#", ad = "http://json-schema.org/draft-07/schema#", od = "Core schema meta-schema", id = { schemaArray: { type: "array", minItems: 1, items: { $ref: "#" } }, nonNegativeInteger: { type: "integer", minimum: 0 }, nonNegativeIntegerDefault0: { allOf: [{ $ref: "#/definitions/nonNegativeInteger" }, { default: 0 }] }, simpleTypes: { enum: ["array", "boolean", "integer", "null", "number", "object", "string"] }, stringArray: { type: "array", items: { type: "string" }, uniqueItems: !0, default: [] } }, cd = ["object", "boolean"], ud = { $id: { type: "string", format: "uri-reference" }, $schema: { type: "string", format: "uri" }, $ref: { type: "string", format: "uri-reference" }, $comment: { type: "string" }, title: { type: "string" }, description: { type: "string" }, default: !0, readOnly: { type: "boolean", default: !1 }, examples: { type: "array", items: !0 }, multipleOf: { type: "number", exclusiveMinimum: 0 }, maximum: { type: "number" }, exclusiveMaximum: { type: "number" }, minimum: { type: "number" }, exclusiveMinimum: { type: "number" }, maxLength: { $ref: "#/definitions/nonNegativeInteger" }, minLength: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, pattern: { type: "string", format: "regex" }, additionalItems: { $ref: "#" }, items: { anyOf: [{ $ref: "#" }, { $ref: "#/definitions/schemaArray" }], default: !0 }, maxItems: { $ref: "#/definitions/nonNegativeInteger" }, minItems: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, uniqueItems: { type: "boolean", default: !1 }, contains: { $ref: "#" }, maxProperties: { $ref: "#/definitions/nonNegativeInteger" }, minProperties: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, required: { $ref: "#/definitions/stringArray" }, additionalProperties: { $ref: "#" }, definitions: { type: "object", additionalProperties: { $ref: "#" }, default: {} }, properties: { type: "object", additionalProperties: { $ref: "#" }, default: {} }, patternProperties: { type: "object", additionalProperties: { $ref: "#" }, propertyNames: { format: "regex" }, default: {} }, dependencies: { type: "object", additionalProperties: { anyOf: [{ $ref: "#" }, { $ref: "#/definitions/stringArray" }] } }, propertyNames: { $ref: "#" }, const: !0, enum: { type: "array", items: !0, minItems: 1, uniqueItems: !0 }, type: { anyOf: [{ $ref: "#/definitions/simpleTypes" }, { type: "array", items: { $ref: "#/definitions/simpleTypes" }, minItems: 1, uniqueItems: !0 }] }, format: { type: "string" }, contentMediaType: { type: "string" }, contentEncoding: { type: "string" }, if: { $ref: "#" }, then: { $ref: "#" }, else: { $ref: "#" }, allOf: { $ref: "#/definitions/schemaArray" }, anyOf: { $ref: "#/definitions/schemaArray" }, oneOf: { $ref: "#/definitions/schemaArray" }, not: { $ref: "#" } }, ld = {
  $schema: sd,
  $id: ad,
  title: od,
  definitions: id,
  type: cd,
  properties: ud,
  default: !0
};
var go;
function dd() {
  return go || (go = 1, (function(e, t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.MissingRefError = t.ValidationError = t.CodeGen = t.Name = t.nil = t.stringify = t.str = t._ = t.KeywordCxt = t.Ajv = void 0;
    const r = /* @__PURE__ */ Ci(), n = /* @__PURE__ */ nd(), a = /* @__PURE__ */ Ki(), s = ld, o = ["/properties"], i = "http://json-schema.org/draft-07/schema";
    class l extends r.default {
      _addVocabularies() {
        super._addVocabularies(), n.default.forEach(($) => this.addVocabulary($)), this.opts.discriminator && this.addKeyword(a.default);
      }
      _addDefaultMetaSchema() {
        if (super._addDefaultMetaSchema(), !this.opts.meta)
          return;
        const $ = this.opts.$data ? this.$dataMetaSchema(s, o) : s;
        this.addMetaSchema($, i, !1), this.refs["http://json-schema.org/schema"] = i;
      }
      defaultMeta() {
        return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(i) ? i : void 0);
      }
    }
    t.Ajv = l, e.exports = t = l, e.exports.Ajv = l, Object.defineProperty(t, "__esModule", { value: !0 }), t.default = l;
    var u = /* @__PURE__ */ wt();
    Object.defineProperty(t, "KeywordCxt", { enumerable: !0, get: function() {
      return u.KeywordCxt;
    } });
    var c = /* @__PURE__ */ Y();
    Object.defineProperty(t, "_", { enumerable: !0, get: function() {
      return c._;
    } }), Object.defineProperty(t, "str", { enumerable: !0, get: function() {
      return c.str;
    } }), Object.defineProperty(t, "stringify", { enumerable: !0, get: function() {
      return c.stringify;
    } }), Object.defineProperty(t, "nil", { enumerable: !0, get: function() {
      return c.nil;
    } }), Object.defineProperty(t, "Name", { enumerable: !0, get: function() {
      return c.Name;
    } }), Object.defineProperty(t, "CodeGen", { enumerable: !0, get: function() {
      return c.CodeGen;
    } });
    var y = /* @__PURE__ */ Gr();
    Object.defineProperty(t, "ValidationError", { enumerable: !0, get: function() {
      return y.default;
    } });
    var f = /* @__PURE__ */ St();
    Object.defineProperty(t, "MissingRefError", { enumerable: !0, get: function() {
      return f.default;
    } });
  })(Sr, Sr.exports)), Sr.exports;
}
var vo;
function fd() {
  return vo || (vo = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.formatLimitDefinition = void 0;
    const t = /* @__PURE__ */ dd(), r = /* @__PURE__ */ Y(), n = r.operators, a = {
      formatMaximum: { okStr: "<=", ok: n.LTE, fail: n.GT },
      formatMinimum: { okStr: ">=", ok: n.GTE, fail: n.LT },
      formatExclusiveMaximum: { okStr: "<", ok: n.LT, fail: n.GTE },
      formatExclusiveMinimum: { okStr: ">", ok: n.GT, fail: n.LTE }
    }, s = {
      message: ({ keyword: i, schemaCode: l }) => (0, r.str)`should be ${a[i].okStr} ${l}`,
      params: ({ keyword: i, schemaCode: l }) => (0, r._)`{comparison: ${a[i].okStr}, limit: ${l}}`
    };
    e.formatLimitDefinition = {
      keyword: Object.keys(a),
      type: "string",
      schemaType: "string",
      $data: !0,
      error: s,
      code(i) {
        const { gen: l, data: u, schemaCode: c, keyword: y, it: f } = i, { opts: h, self: $ } = f;
        if (!h.validateFormats)
          return;
        const _ = new t.KeywordCxt(f, $.RULES.all.format.definition, "format");
        _.$data ? p() : v();
        function p() {
          const g = l.scopeValue("formats", {
            ref: $.formats,
            code: h.code.formats
          }), S = l.const("fmt", (0, r._)`${g}[${_.schemaCode}]`);
          i.fail$data((0, r.or)((0, r._)`typeof ${S} != "object"`, (0, r._)`${S} instanceof RegExp`, (0, r._)`typeof ${S}.compare != "function"`, d(S)));
        }
        function v() {
          const g = _.schema, S = $.formats[g];
          if (!S || S === !0)
            return;
          if (typeof S != "object" || S instanceof RegExp || typeof S.compare != "function")
            throw new Error(`"${y}": format "${g}" does not define "compare" function`);
          const m = l.scopeValue("formats", {
            key: g,
            ref: S,
            code: h.code.formats ? (0, r._)`${h.code.formats}${(0, r.getProperty)(g)}` : void 0
          });
          i.fail$data(d(m));
        }
        function d(g) {
          return (0, r._)`${g}.compare(${u}, ${c}) ${a[y].fail} 0`;
        }
      },
      dependencies: ["format"]
    };
    const o = (i) => (i.addKeyword(e.formatLimitDefinition), i);
    e.default = o;
  })(hn)), hn;
}
var _o;
function pd() {
  return _o || (_o = 1, (function(e, t) {
    Object.defineProperty(t, "__esModule", { value: !0 });
    const r = rd(), n = fd(), a = /* @__PURE__ */ Y(), s = new a.Name("fullFormats"), o = new a.Name("fastFormats"), i = (u, c = { keywords: !0 }) => {
      if (Array.isArray(c))
        return l(u, c, r.fullFormats, s), u;
      const [y, f] = c.mode === "fast" ? [r.fastFormats, o] : [r.fullFormats, s], h = c.formats || r.formatNames;
      return l(u, h, y, f), c.keywords && (0, n.default)(u), u;
    };
    i.get = (u, c = "full") => {
      const f = (c === "fast" ? r.fastFormats : r.fullFormats)[u];
      if (!f)
        throw new Error(`Unknown format "${u}"`);
      return f;
    };
    function l(u, c, y, f) {
      var h, $;
      (h = ($ = u.opts.code).formats) !== null && h !== void 0 || ($.formats = (0, a._)`require("ajv-formats/dist/formats").${f}`);
      for (const _ of c)
        u.addFormat(_, y[_]);
    }
    e.exports = t = i, Object.defineProperty(t, "__esModule", { value: !0 }), t.default = i;
  })(wr, wr.exports)), wr.exports;
}
var hd = pd();
const md = /* @__PURE__ */ Ti(hd), yd = (e, t, r, n) => {
  if (r === "length" || r === "prototype" || r === "arguments" || r === "caller")
    return;
  const a = Object.getOwnPropertyDescriptor(e, r), s = Object.getOwnPropertyDescriptor(t, r);
  !gd(a, s) && n || Object.defineProperty(e, r, s);
}, gd = function(e, t) {
  return e === void 0 || e.configurable || e.writable === t.writable && e.enumerable === t.enumerable && e.configurable === t.configurable && (e.writable || e.value === t.value);
}, vd = (e, t) => {
  const r = Object.getPrototypeOf(t);
  r !== Object.getPrototypeOf(e) && Object.setPrototypeOf(e, r);
}, _d = (e, t) => `/* Wrapped ${e}*/
${t}`, $d = Object.getOwnPropertyDescriptor(Function.prototype, "toString"), Ed = Object.getOwnPropertyDescriptor(Function.prototype.toString, "name"), wd = (e, t, r) => {
  const n = r === "" ? "" : `with ${r.trim()}() `, a = _d.bind(null, n, t.toString());
  Object.defineProperty(a, "name", Ed);
  const { writable: s, enumerable: o, configurable: i } = $d;
  Object.defineProperty(e, "toString", { value: a, writable: s, enumerable: o, configurable: i });
};
function Sd(e, t, { ignoreNonConfigurable: r = !1 } = {}) {
  const { name: n } = e;
  for (const a of Reflect.ownKeys(t))
    yd(e, t, a, r);
  return vd(e, t), wd(e, t, n), e;
}
const $o = (e, t = {}) => {
  if (typeof e != "function")
    throw new TypeError(`Expected the first argument to be a function, got \`${typeof e}\``);
  const {
    wait: r = 0,
    maxWait: n = Number.POSITIVE_INFINITY,
    before: a = !1,
    after: s = !0
  } = t;
  if (r < 0 || n < 0)
    throw new RangeError("`wait` and `maxWait` must not be negative.");
  if (!a && !s)
    throw new Error("Both `before` and `after` are false, function wouldn't be called.");
  let o, i, l;
  const u = function(...c) {
    const y = this, f = () => {
      o = void 0, i && (clearTimeout(i), i = void 0), s && (l = e.apply(y, c));
    }, h = () => {
      i = void 0, o && (clearTimeout(o), o = void 0), s && (l = e.apply(y, c));
    }, $ = a && !o;
    return clearTimeout(o), o = setTimeout(f, r), n > 0 && n !== Number.POSITIVE_INFINITY && !i && (i = setTimeout(h, n)), $ && (l = e.apply(y, c)), l;
  };
  return Sd(u, e), u.cancel = () => {
    o && (clearTimeout(o), o = void 0), i && (clearTimeout(i), i = void 0);
  }, u;
};
var Rr = { exports: {} }, mn, Eo;
function Kr() {
  if (Eo) return mn;
  Eo = 1;
  const e = "2.0.0", t = 256, r = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
  9007199254740991, n = 16, a = t - 6;
  return mn = {
    MAX_LENGTH: t,
    MAX_SAFE_COMPONENT_LENGTH: n,
    MAX_SAFE_BUILD_LENGTH: a,
    MAX_SAFE_INTEGER: r,
    RELEASE_TYPES: [
      "major",
      "premajor",
      "minor",
      "preminor",
      "patch",
      "prepatch",
      "prerelease"
    ],
    SEMVER_SPEC_VERSION: e,
    FLAG_INCLUDE_PRERELEASE: 1,
    FLAG_LOOSE: 2
  }, mn;
}
var yn, wo;
function Hr() {
  return wo || (wo = 1, yn = typeof process == "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...t) => console.error("SEMVER", ...t) : () => {
  }), yn;
}
var So;
function bt() {
  return So || (So = 1, (function(e, t) {
    const {
      MAX_SAFE_COMPONENT_LENGTH: r,
      MAX_SAFE_BUILD_LENGTH: n,
      MAX_LENGTH: a
    } = Kr(), s = Hr();
    t = e.exports = {};
    const o = t.re = [], i = t.safeRe = [], l = t.src = [], u = t.safeSrc = [], c = t.t = {};
    let y = 0;
    const f = "[a-zA-Z0-9-]", h = [
      ["\\s", 1],
      ["\\d", a],
      [f, n]
    ], $ = (p) => {
      for (const [v, d] of h)
        p = p.split(`${v}*`).join(`${v}{0,${d}}`).split(`${v}+`).join(`${v}{1,${d}}`);
      return p;
    }, _ = (p, v, d) => {
      const g = $(v), S = y++;
      s(p, S, v), c[p] = S, l[S] = v, u[S] = g, o[S] = new RegExp(v, d ? "g" : void 0), i[S] = new RegExp(g, d ? "g" : void 0);
    };
    _("NUMERICIDENTIFIER", "0|[1-9]\\d*"), _("NUMERICIDENTIFIERLOOSE", "\\d+"), _("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${f}*`), _("MAINVERSION", `(${l[c.NUMERICIDENTIFIER]})\\.(${l[c.NUMERICIDENTIFIER]})\\.(${l[c.NUMERICIDENTIFIER]})`), _("MAINVERSIONLOOSE", `(${l[c.NUMERICIDENTIFIERLOOSE]})\\.(${l[c.NUMERICIDENTIFIERLOOSE]})\\.(${l[c.NUMERICIDENTIFIERLOOSE]})`), _("PRERELEASEIDENTIFIER", `(?:${l[c.NONNUMERICIDENTIFIER]}|${l[c.NUMERICIDENTIFIER]})`), _("PRERELEASEIDENTIFIERLOOSE", `(?:${l[c.NONNUMERICIDENTIFIER]}|${l[c.NUMERICIDENTIFIERLOOSE]})`), _("PRERELEASE", `(?:-(${l[c.PRERELEASEIDENTIFIER]}(?:\\.${l[c.PRERELEASEIDENTIFIER]})*))`), _("PRERELEASELOOSE", `(?:-?(${l[c.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${l[c.PRERELEASEIDENTIFIERLOOSE]})*))`), _("BUILDIDENTIFIER", `${f}+`), _("BUILD", `(?:\\+(${l[c.BUILDIDENTIFIER]}(?:\\.${l[c.BUILDIDENTIFIER]})*))`), _("FULLPLAIN", `v?${l[c.MAINVERSION]}${l[c.PRERELEASE]}?${l[c.BUILD]}?`), _("FULL", `^${l[c.FULLPLAIN]}$`), _("LOOSEPLAIN", `[v=\\s]*${l[c.MAINVERSIONLOOSE]}${l[c.PRERELEASELOOSE]}?${l[c.BUILD]}?`), _("LOOSE", `^${l[c.LOOSEPLAIN]}$`), _("GTLT", "((?:<|>)?=?)"), _("XRANGEIDENTIFIERLOOSE", `${l[c.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), _("XRANGEIDENTIFIER", `${l[c.NUMERICIDENTIFIER]}|x|X|\\*`), _("XRANGEPLAIN", `[v=\\s]*(${l[c.XRANGEIDENTIFIER]})(?:\\.(${l[c.XRANGEIDENTIFIER]})(?:\\.(${l[c.XRANGEIDENTIFIER]})(?:${l[c.PRERELEASE]})?${l[c.BUILD]}?)?)?`), _("XRANGEPLAINLOOSE", `[v=\\s]*(${l[c.XRANGEIDENTIFIERLOOSE]})(?:\\.(${l[c.XRANGEIDENTIFIERLOOSE]})(?:\\.(${l[c.XRANGEIDENTIFIERLOOSE]})(?:${l[c.PRERELEASELOOSE]})?${l[c.BUILD]}?)?)?`), _("XRANGE", `^${l[c.GTLT]}\\s*${l[c.XRANGEPLAIN]}$`), _("XRANGELOOSE", `^${l[c.GTLT]}\\s*${l[c.XRANGEPLAINLOOSE]}$`), _("COERCEPLAIN", `(^|[^\\d])(\\d{1,${r}})(?:\\.(\\d{1,${r}}))?(?:\\.(\\d{1,${r}}))?`), _("COERCE", `${l[c.COERCEPLAIN]}(?:$|[^\\d])`), _("COERCEFULL", l[c.COERCEPLAIN] + `(?:${l[c.PRERELEASE]})?(?:${l[c.BUILD]})?(?:$|[^\\d])`), _("COERCERTL", l[c.COERCE], !0), _("COERCERTLFULL", l[c.COERCEFULL], !0), _("LONETILDE", "(?:~>?)"), _("TILDETRIM", `(\\s*)${l[c.LONETILDE]}\\s+`, !0), t.tildeTrimReplace = "$1~", _("TILDE", `^${l[c.LONETILDE]}${l[c.XRANGEPLAIN]}$`), _("TILDELOOSE", `^${l[c.LONETILDE]}${l[c.XRANGEPLAINLOOSE]}$`), _("LONECARET", "(?:\\^)"), _("CARETTRIM", `(\\s*)${l[c.LONECARET]}\\s+`, !0), t.caretTrimReplace = "$1^", _("CARET", `^${l[c.LONECARET]}${l[c.XRANGEPLAIN]}$`), _("CARETLOOSE", `^${l[c.LONECARET]}${l[c.XRANGEPLAINLOOSE]}$`), _("COMPARATORLOOSE", `^${l[c.GTLT]}\\s*(${l[c.LOOSEPLAIN]})$|^$`), _("COMPARATOR", `^${l[c.GTLT]}\\s*(${l[c.FULLPLAIN]})$|^$`), _("COMPARATORTRIM", `(\\s*)${l[c.GTLT]}\\s*(${l[c.LOOSEPLAIN]}|${l[c.XRANGEPLAIN]})`, !0), t.comparatorTrimReplace = "$1$2$3", _("HYPHENRANGE", `^\\s*(${l[c.XRANGEPLAIN]})\\s+-\\s+(${l[c.XRANGEPLAIN]})\\s*$`), _("HYPHENRANGELOOSE", `^\\s*(${l[c.XRANGEPLAINLOOSE]})\\s+-\\s+(${l[c.XRANGEPLAINLOOSE]})\\s*$`), _("STAR", "(<|>)?=?\\s*\\*"), _("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), _("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  })(Rr, Rr.exports)), Rr.exports;
}
var gn, bo;
function Ps() {
  if (bo) return gn;
  bo = 1;
  const e = Object.freeze({ loose: !0 }), t = Object.freeze({});
  return gn = (n) => n ? typeof n != "object" ? e : n : t, gn;
}
var vn, Ro;
function Hi() {
  if (Ro) return vn;
  Ro = 1;
  const e = /^[0-9]+$/, t = (n, a) => {
    if (typeof n == "number" && typeof a == "number")
      return n === a ? 0 : n < a ? -1 : 1;
    const s = e.test(n), o = e.test(a);
    return s && o && (n = +n, a = +a), n === a ? 0 : s && !o ? -1 : o && !s ? 1 : n < a ? -1 : 1;
  };
  return vn = {
    compareIdentifiers: t,
    rcompareIdentifiers: (n, a) => t(a, n)
  }, vn;
}
var _n, Po;
function ye() {
  if (Po) return _n;
  Po = 1;
  const e = Hr(), { MAX_LENGTH: t, MAX_SAFE_INTEGER: r } = Kr(), { safeRe: n, t: a } = bt(), s = Ps(), { compareIdentifiers: o } = Hi();
  class i {
    constructor(u, c) {
      if (c = s(c), u instanceof i) {
        if (u.loose === !!c.loose && u.includePrerelease === !!c.includePrerelease)
          return u;
        u = u.version;
      } else if (typeof u != "string")
        throw new TypeError(`Invalid version. Must be a string. Got type "${typeof u}".`);
      if (u.length > t)
        throw new TypeError(
          `version is longer than ${t} characters`
        );
      e("SemVer", u, c), this.options = c, this.loose = !!c.loose, this.includePrerelease = !!c.includePrerelease;
      const y = u.trim().match(c.loose ? n[a.LOOSE] : n[a.FULL]);
      if (!y)
        throw new TypeError(`Invalid Version: ${u}`);
      if (this.raw = u, this.major = +y[1], this.minor = +y[2], this.patch = +y[3], this.major > r || this.major < 0)
        throw new TypeError("Invalid major version");
      if (this.minor > r || this.minor < 0)
        throw new TypeError("Invalid minor version");
      if (this.patch > r || this.patch < 0)
        throw new TypeError("Invalid patch version");
      y[4] ? this.prerelease = y[4].split(".").map((f) => {
        if (/^[0-9]+$/.test(f)) {
          const h = +f;
          if (h >= 0 && h < r)
            return h;
        }
        return f;
      }) : this.prerelease = [], this.build = y[5] ? y[5].split(".") : [], this.format();
    }
    format() {
      return this.version = `${this.major}.${this.minor}.${this.patch}`, this.prerelease.length && (this.version += `-${this.prerelease.join(".")}`), this.version;
    }
    toString() {
      return this.version;
    }
    compare(u) {
      if (e("SemVer.compare", this.version, this.options, u), !(u instanceof i)) {
        if (typeof u == "string" && u === this.version)
          return 0;
        u = new i(u, this.options);
      }
      return u.version === this.version ? 0 : this.compareMain(u) || this.comparePre(u);
    }
    compareMain(u) {
      return u instanceof i || (u = new i(u, this.options)), this.major < u.major ? -1 : this.major > u.major ? 1 : this.minor < u.minor ? -1 : this.minor > u.minor ? 1 : this.patch < u.patch ? -1 : this.patch > u.patch ? 1 : 0;
    }
    comparePre(u) {
      if (u instanceof i || (u = new i(u, this.options)), this.prerelease.length && !u.prerelease.length)
        return -1;
      if (!this.prerelease.length && u.prerelease.length)
        return 1;
      if (!this.prerelease.length && !u.prerelease.length)
        return 0;
      let c = 0;
      do {
        const y = this.prerelease[c], f = u.prerelease[c];
        if (e("prerelease compare", c, y, f), y === void 0 && f === void 0)
          return 0;
        if (f === void 0)
          return 1;
        if (y === void 0)
          return -1;
        if (y === f)
          continue;
        return o(y, f);
      } while (++c);
    }
    compareBuild(u) {
      u instanceof i || (u = new i(u, this.options));
      let c = 0;
      do {
        const y = this.build[c], f = u.build[c];
        if (e("build compare", c, y, f), y === void 0 && f === void 0)
          return 0;
        if (f === void 0)
          return 1;
        if (y === void 0)
          return -1;
        if (y === f)
          continue;
        return o(y, f);
      } while (++c);
    }
    // preminor will bump the version up to the next minor release, and immediately
    // down to pre-release. premajor and prepatch work the same way.
    inc(u, c, y) {
      if (u.startsWith("pre")) {
        if (!c && y === !1)
          throw new Error("invalid increment argument: identifier is empty");
        if (c) {
          const f = `-${c}`.match(this.options.loose ? n[a.PRERELEASELOOSE] : n[a.PRERELEASE]);
          if (!f || f[1] !== c)
            throw new Error(`invalid identifier: ${c}`);
        }
      }
      switch (u) {
        case "premajor":
          this.prerelease.length = 0, this.patch = 0, this.minor = 0, this.major++, this.inc("pre", c, y);
          break;
        case "preminor":
          this.prerelease.length = 0, this.patch = 0, this.minor++, this.inc("pre", c, y);
          break;
        case "prepatch":
          this.prerelease.length = 0, this.inc("patch", c, y), this.inc("pre", c, y);
          break;
        // If the input is a non-prerelease version, this acts the same as
        // prepatch.
        case "prerelease":
          this.prerelease.length === 0 && this.inc("patch", c, y), this.inc("pre", c, y);
          break;
        case "release":
          if (this.prerelease.length === 0)
            throw new Error(`version ${this.raw} is not a prerelease`);
          this.prerelease.length = 0;
          break;
        case "major":
          (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) && this.major++, this.minor = 0, this.patch = 0, this.prerelease = [];
          break;
        case "minor":
          (this.patch !== 0 || this.prerelease.length === 0) && this.minor++, this.patch = 0, this.prerelease = [];
          break;
        case "patch":
          this.prerelease.length === 0 && this.patch++, this.prerelease = [];
          break;
        // This probably shouldn't be used publicly.
        // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
        case "pre": {
          const f = Number(y) ? 1 : 0;
          if (this.prerelease.length === 0)
            this.prerelease = [f];
          else {
            let h = this.prerelease.length;
            for (; --h >= 0; )
              typeof this.prerelease[h] == "number" && (this.prerelease[h]++, h = -2);
            if (h === -1) {
              if (c === this.prerelease.join(".") && y === !1)
                throw new Error("invalid increment argument: identifier already exists");
              this.prerelease.push(f);
            }
          }
          if (c) {
            let h = [c, f];
            y === !1 && (h = [c]), o(this.prerelease[0], c) === 0 ? isNaN(this.prerelease[1]) && (this.prerelease = h) : this.prerelease = h;
          }
          break;
        }
        default:
          throw new Error(`invalid increment argument: ${u}`);
      }
      return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), this;
    }
  }
  return _n = i, _n;
}
var $n, Io;
function dt() {
  if (Io) return $n;
  Io = 1;
  const e = ye();
  return $n = (r, n, a = !1) => {
    if (r instanceof e)
      return r;
    try {
      return new e(r, n);
    } catch (s) {
      if (!a)
        return null;
      throw s;
    }
  }, $n;
}
var En, Oo;
function bd() {
  if (Oo) return En;
  Oo = 1;
  const e = dt();
  return En = (r, n) => {
    const a = e(r, n);
    return a ? a.version : null;
  }, En;
}
var wn, To;
function Rd() {
  if (To) return wn;
  To = 1;
  const e = dt();
  return wn = (r, n) => {
    const a = e(r.trim().replace(/^[=v]+/, ""), n);
    return a ? a.version : null;
  }, wn;
}
var Sn, No;
function Pd() {
  if (No) return Sn;
  No = 1;
  const e = ye();
  return Sn = (r, n, a, s, o) => {
    typeof a == "string" && (o = s, s = a, a = void 0);
    try {
      return new e(
        r instanceof e ? r.version : r,
        a
      ).inc(n, s, o).version;
    } catch {
      return null;
    }
  }, Sn;
}
var bn, Ao;
function Id() {
  if (Ao) return bn;
  Ao = 1;
  const e = dt();
  return bn = (r, n) => {
    const a = e(r, null, !0), s = e(n, null, !0), o = a.compare(s);
    if (o === 0)
      return null;
    const i = o > 0, l = i ? a : s, u = i ? s : a, c = !!l.prerelease.length;
    if (!!u.prerelease.length && !c) {
      if (!u.patch && !u.minor)
        return "major";
      if (u.compareMain(l) === 0)
        return u.minor && !u.patch ? "minor" : "patch";
    }
    const f = c ? "pre" : "";
    return a.major !== s.major ? f + "major" : a.minor !== s.minor ? f + "minor" : a.patch !== s.patch ? f + "patch" : "prerelease";
  }, bn;
}
var Rn, jo;
function Od() {
  if (jo) return Rn;
  jo = 1;
  const e = ye();
  return Rn = (r, n) => new e(r, n).major, Rn;
}
var Pn, ko;
function Td() {
  if (ko) return Pn;
  ko = 1;
  const e = ye();
  return Pn = (r, n) => new e(r, n).minor, Pn;
}
var In, Co;
function Nd() {
  if (Co) return In;
  Co = 1;
  const e = ye();
  return In = (r, n) => new e(r, n).patch, In;
}
var On, qo;
function Ad() {
  if (qo) return On;
  qo = 1;
  const e = dt();
  return On = (r, n) => {
    const a = e(r, n);
    return a && a.prerelease.length ? a.prerelease : null;
  }, On;
}
var Tn, Do;
function Oe() {
  if (Do) return Tn;
  Do = 1;
  const e = ye();
  return Tn = (r, n, a) => new e(r, a).compare(new e(n, a)), Tn;
}
var Nn, Lo;
function jd() {
  if (Lo) return Nn;
  Lo = 1;
  const e = Oe();
  return Nn = (r, n, a) => e(n, r, a), Nn;
}
var An, Mo;
function kd() {
  if (Mo) return An;
  Mo = 1;
  const e = Oe();
  return An = (r, n) => e(r, n, !0), An;
}
var jn, Uo;
function Is() {
  if (Uo) return jn;
  Uo = 1;
  const e = ye();
  return jn = (r, n, a) => {
    const s = new e(r, a), o = new e(n, a);
    return s.compare(o) || s.compareBuild(o);
  }, jn;
}
var kn, Fo;
function Cd() {
  if (Fo) return kn;
  Fo = 1;
  const e = Is();
  return kn = (r, n) => r.sort((a, s) => e(a, s, n)), kn;
}
var Cn, Vo;
function qd() {
  if (Vo) return Cn;
  Vo = 1;
  const e = Is();
  return Cn = (r, n) => r.sort((a, s) => e(s, a, n)), Cn;
}
var qn, zo;
function Br() {
  if (zo) return qn;
  zo = 1;
  const e = Oe();
  return qn = (r, n, a) => e(r, n, a) > 0, qn;
}
var Dn, Go;
function Os() {
  if (Go) return Dn;
  Go = 1;
  const e = Oe();
  return Dn = (r, n, a) => e(r, n, a) < 0, Dn;
}
var Ln, xo;
function Bi() {
  if (xo) return Ln;
  xo = 1;
  const e = Oe();
  return Ln = (r, n, a) => e(r, n, a) === 0, Ln;
}
var Mn, Ko;
function Wi() {
  if (Ko) return Mn;
  Ko = 1;
  const e = Oe();
  return Mn = (r, n, a) => e(r, n, a) !== 0, Mn;
}
var Un, Ho;
function Ts() {
  if (Ho) return Un;
  Ho = 1;
  const e = Oe();
  return Un = (r, n, a) => e(r, n, a) >= 0, Un;
}
var Fn, Bo;
function Ns() {
  if (Bo) return Fn;
  Bo = 1;
  const e = Oe();
  return Fn = (r, n, a) => e(r, n, a) <= 0, Fn;
}
var Vn, Wo;
function Xi() {
  if (Wo) return Vn;
  Wo = 1;
  const e = Bi(), t = Wi(), r = Br(), n = Ts(), a = Os(), s = Ns();
  return Vn = (i, l, u, c) => {
    switch (l) {
      case "===":
        return typeof i == "object" && (i = i.version), typeof u == "object" && (u = u.version), i === u;
      case "!==":
        return typeof i == "object" && (i = i.version), typeof u == "object" && (u = u.version), i !== u;
      case "":
      case "=":
      case "==":
        return e(i, u, c);
      case "!=":
        return t(i, u, c);
      case ">":
        return r(i, u, c);
      case ">=":
        return n(i, u, c);
      case "<":
        return a(i, u, c);
      case "<=":
        return s(i, u, c);
      default:
        throw new TypeError(`Invalid operator: ${l}`);
    }
  }, Vn;
}
var zn, Xo;
function Dd() {
  if (Xo) return zn;
  Xo = 1;
  const e = ye(), t = dt(), { safeRe: r, t: n } = bt();
  return zn = (s, o) => {
    if (s instanceof e)
      return s;
    if (typeof s == "number" && (s = String(s)), typeof s != "string")
      return null;
    o = o || {};
    let i = null;
    if (!o.rtl)
      i = s.match(o.includePrerelease ? r[n.COERCEFULL] : r[n.COERCE]);
    else {
      const h = o.includePrerelease ? r[n.COERCERTLFULL] : r[n.COERCERTL];
      let $;
      for (; ($ = h.exec(s)) && (!i || i.index + i[0].length !== s.length); )
        (!i || $.index + $[0].length !== i.index + i[0].length) && (i = $), h.lastIndex = $.index + $[1].length + $[2].length;
      h.lastIndex = -1;
    }
    if (i === null)
      return null;
    const l = i[2], u = i[3] || "0", c = i[4] || "0", y = o.includePrerelease && i[5] ? `-${i[5]}` : "", f = o.includePrerelease && i[6] ? `+${i[6]}` : "";
    return t(`${l}.${u}.${c}${y}${f}`, o);
  }, zn;
}
var Gn, Yo;
function Ld() {
  if (Yo) return Gn;
  Yo = 1;
  class e {
    constructor() {
      this.max = 1e3, this.map = /* @__PURE__ */ new Map();
    }
    get(r) {
      const n = this.map.get(r);
      if (n !== void 0)
        return this.map.delete(r), this.map.set(r, n), n;
    }
    delete(r) {
      return this.map.delete(r);
    }
    set(r, n) {
      if (!this.delete(r) && n !== void 0) {
        if (this.map.size >= this.max) {
          const s = this.map.keys().next().value;
          this.delete(s);
        }
        this.map.set(r, n);
      }
      return this;
    }
  }
  return Gn = e, Gn;
}
var xn, Jo;
function Te() {
  if (Jo) return xn;
  Jo = 1;
  const e = /\s+/g;
  class t {
    constructor(D, H) {
      if (H = a(H), D instanceof t)
        return D.loose === !!H.loose && D.includePrerelease === !!H.includePrerelease ? D : new t(D.raw, H);
      if (D instanceof s)
        return this.raw = D.value, this.set = [[D]], this.formatted = void 0, this;
      if (this.options = H, this.loose = !!H.loose, this.includePrerelease = !!H.includePrerelease, this.raw = D.trim().replace(e, " "), this.set = this.raw.split("||").map((x) => this.parseRange(x.trim())).filter((x) => x.length), !this.set.length)
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      if (this.set.length > 1) {
        const x = this.set[0];
        if (this.set = this.set.filter((V) => !_(V[0])), this.set.length === 0)
          this.set = [x];
        else if (this.set.length > 1) {
          for (const V of this.set)
            if (V.length === 1 && p(V[0])) {
              this.set = [V];
              break;
            }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (this.formatted === void 0) {
        this.formatted = "";
        for (let D = 0; D < this.set.length; D++) {
          D > 0 && (this.formatted += "||");
          const H = this.set[D];
          for (let x = 0; x < H.length; x++)
            x > 0 && (this.formatted += " "), this.formatted += H[x].toString().trim();
        }
      }
      return this.formatted;
    }
    format() {
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange(D) {
      const x = ((this.options.includePrerelease && h) | (this.options.loose && $)) + ":" + D, V = n.get(x);
      if (V)
        return V;
      const K = this.options.loose, k = K ? l[u.HYPHENRANGELOOSE] : l[u.HYPHENRANGE];
      D = D.replace(k, F(this.options.includePrerelease)), o("hyphen replace", D), D = D.replace(l[u.COMPARATORTRIM], c), o("comparator trim", D), D = D.replace(l[u.TILDETRIM], y), o("tilde trim", D), D = D.replace(l[u.CARETTRIM], f), o("caret trim", D);
      let P = D.split(" ").map((R) => d(R, this.options)).join(" ").split(/\s+/).map((R) => q(R, this.options));
      K && (P = P.filter((R) => (o("loose invalid filter", R, this.options), !!R.match(l[u.COMPARATORLOOSE])))), o("range list", P);
      const A = /* @__PURE__ */ new Map(), I = P.map((R) => new s(R, this.options));
      for (const R of I) {
        if (_(R))
          return [R];
        A.set(R.value, R);
      }
      A.size > 1 && A.has("") && A.delete("");
      const w = [...A.values()];
      return n.set(x, w), w;
    }
    intersects(D, H) {
      if (!(D instanceof t))
        throw new TypeError("a Range is required");
      return this.set.some((x) => v(x, H) && D.set.some((V) => v(V, H) && x.every((K) => V.every((k) => K.intersects(k, H)))));
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(D) {
      if (!D)
        return !1;
      if (typeof D == "string")
        try {
          D = new i(D, this.options);
        } catch {
          return !1;
        }
      for (let H = 0; H < this.set.length; H++)
        if (G(this.set[H], D, this.options))
          return !0;
      return !1;
    }
  }
  xn = t;
  const r = Ld(), n = new r(), a = Ps(), s = Wr(), o = Hr(), i = ye(), {
    safeRe: l,
    t: u,
    comparatorTrimReplace: c,
    tildeTrimReplace: y,
    caretTrimReplace: f
  } = bt(), { FLAG_INCLUDE_PRERELEASE: h, FLAG_LOOSE: $ } = Kr(), _ = (j) => j.value === "<0.0.0-0", p = (j) => j.value === "", v = (j, D) => {
    let H = !0;
    const x = j.slice();
    let V = x.pop();
    for (; H && x.length; )
      H = x.every((K) => V.intersects(K, D)), V = x.pop();
    return H;
  }, d = (j, D) => (j = j.replace(l[u.BUILD], ""), o("comp", j, D), j = E(j, D), o("caret", j), j = S(j, D), o("tildes", j), j = T(j, D), o("xrange", j), j = z(j, D), o("stars", j), j), g = (j) => !j || j.toLowerCase() === "x" || j === "*", S = (j, D) => j.trim().split(/\s+/).map((H) => m(H, D)).join(" "), m = (j, D) => {
    const H = D.loose ? l[u.TILDELOOSE] : l[u.TILDE];
    return j.replace(H, (x, V, K, k, P) => {
      o("tilde", j, x, V, K, k, P);
      let A;
      return g(V) ? A = "" : g(K) ? A = `>=${V}.0.0 <${+V + 1}.0.0-0` : g(k) ? A = `>=${V}.${K}.0 <${V}.${+K + 1}.0-0` : P ? (o("replaceTilde pr", P), A = `>=${V}.${K}.${k}-${P} <${V}.${+K + 1}.0-0`) : A = `>=${V}.${K}.${k} <${V}.${+K + 1}.0-0`, o("tilde return", A), A;
    });
  }, E = (j, D) => j.trim().split(/\s+/).map((H) => b(H, D)).join(" "), b = (j, D) => {
    o("caret", j, D);
    const H = D.loose ? l[u.CARETLOOSE] : l[u.CARET], x = D.includePrerelease ? "-0" : "";
    return j.replace(H, (V, K, k, P, A) => {
      o("caret", j, V, K, k, P, A);
      let I;
      return g(K) ? I = "" : g(k) ? I = `>=${K}.0.0${x} <${+K + 1}.0.0-0` : g(P) ? K === "0" ? I = `>=${K}.${k}.0${x} <${K}.${+k + 1}.0-0` : I = `>=${K}.${k}.0${x} <${+K + 1}.0.0-0` : A ? (o("replaceCaret pr", A), K === "0" ? k === "0" ? I = `>=${K}.${k}.${P}-${A} <${K}.${k}.${+P + 1}-0` : I = `>=${K}.${k}.${P}-${A} <${K}.${+k + 1}.0-0` : I = `>=${K}.${k}.${P}-${A} <${+K + 1}.0.0-0`) : (o("no pr"), K === "0" ? k === "0" ? I = `>=${K}.${k}.${P}${x} <${K}.${k}.${+P + 1}-0` : I = `>=${K}.${k}.${P}${x} <${K}.${+k + 1}.0-0` : I = `>=${K}.${k}.${P} <${+K + 1}.0.0-0`), o("caret return", I), I;
    });
  }, T = (j, D) => (o("replaceXRanges", j, D), j.split(/\s+/).map((H) => M(H, D)).join(" ")), M = (j, D) => {
    j = j.trim();
    const H = D.loose ? l[u.XRANGELOOSE] : l[u.XRANGE];
    return j.replace(H, (x, V, K, k, P, A) => {
      o("xRange", j, x, V, K, k, P, A);
      const I = g(K), w = I || g(k), R = w || g(P), C = R;
      return V === "=" && C && (V = ""), A = D.includePrerelease ? "-0" : "", I ? V === ">" || V === "<" ? x = "<0.0.0-0" : x = "*" : V && C ? (w && (k = 0), P = 0, V === ">" ? (V = ">=", w ? (K = +K + 1, k = 0, P = 0) : (k = +k + 1, P = 0)) : V === "<=" && (V = "<", w ? K = +K + 1 : k = +k + 1), V === "<" && (A = "-0"), x = `${V + K}.${k}.${P}${A}`) : w ? x = `>=${K}.0.0${A} <${+K + 1}.0.0-0` : R && (x = `>=${K}.${k}.0${A} <${K}.${+k + 1}.0-0`), o("xRange return", x), x;
    });
  }, z = (j, D) => (o("replaceStars", j, D), j.trim().replace(l[u.STAR], "")), q = (j, D) => (o("replaceGTE0", j, D), j.trim().replace(l[D.includePrerelease ? u.GTE0PRE : u.GTE0], "")), F = (j) => (D, H, x, V, K, k, P, A, I, w, R, C) => (g(x) ? H = "" : g(V) ? H = `>=${x}.0.0${j ? "-0" : ""}` : g(K) ? H = `>=${x}.${V}.0${j ? "-0" : ""}` : k ? H = `>=${H}` : H = `>=${H}${j ? "-0" : ""}`, g(I) ? A = "" : g(w) ? A = `<${+I + 1}.0.0-0` : g(R) ? A = `<${I}.${+w + 1}.0-0` : C ? A = `<=${I}.${w}.${R}-${C}` : j ? A = `<${I}.${w}.${+R + 1}-0` : A = `<=${A}`, `${H} ${A}`.trim()), G = (j, D, H) => {
    for (let x = 0; x < j.length; x++)
      if (!j[x].test(D))
        return !1;
    if (D.prerelease.length && !H.includePrerelease) {
      for (let x = 0; x < j.length; x++)
        if (o(j[x].semver), j[x].semver !== s.ANY && j[x].semver.prerelease.length > 0) {
          const V = j[x].semver;
          if (V.major === D.major && V.minor === D.minor && V.patch === D.patch)
            return !0;
        }
      return !1;
    }
    return !0;
  };
  return xn;
}
var Kn, Qo;
function Wr() {
  if (Qo) return Kn;
  Qo = 1;
  const e = Symbol("SemVer ANY");
  class t {
    static get ANY() {
      return e;
    }
    constructor(c, y) {
      if (y = r(y), c instanceof t) {
        if (c.loose === !!y.loose)
          return c;
        c = c.value;
      }
      c = c.trim().split(/\s+/).join(" "), o("comparator", c, y), this.options = y, this.loose = !!y.loose, this.parse(c), this.semver === e ? this.value = "" : this.value = this.operator + this.semver.version, o("comp", this);
    }
    parse(c) {
      const y = this.options.loose ? n[a.COMPARATORLOOSE] : n[a.COMPARATOR], f = c.match(y);
      if (!f)
        throw new TypeError(`Invalid comparator: ${c}`);
      this.operator = f[1] !== void 0 ? f[1] : "", this.operator === "=" && (this.operator = ""), f[2] ? this.semver = new i(f[2], this.options.loose) : this.semver = e;
    }
    toString() {
      return this.value;
    }
    test(c) {
      if (o("Comparator.test", c, this.options.loose), this.semver === e || c === e)
        return !0;
      if (typeof c == "string")
        try {
          c = new i(c, this.options);
        } catch {
          return !1;
        }
      return s(c, this.operator, this.semver, this.options);
    }
    intersects(c, y) {
      if (!(c instanceof t))
        throw new TypeError("a Comparator is required");
      return this.operator === "" ? this.value === "" ? !0 : new l(c.value, y).test(this.value) : c.operator === "" ? c.value === "" ? !0 : new l(this.value, y).test(c.semver) : (y = r(y), y.includePrerelease && (this.value === "<0.0.0-0" || c.value === "<0.0.0-0") || !y.includePrerelease && (this.value.startsWith("<0.0.0") || c.value.startsWith("<0.0.0")) ? !1 : !!(this.operator.startsWith(">") && c.operator.startsWith(">") || this.operator.startsWith("<") && c.operator.startsWith("<") || this.semver.version === c.semver.version && this.operator.includes("=") && c.operator.includes("=") || s(this.semver, "<", c.semver, y) && this.operator.startsWith(">") && c.operator.startsWith("<") || s(this.semver, ">", c.semver, y) && this.operator.startsWith("<") && c.operator.startsWith(">")));
    }
  }
  Kn = t;
  const r = Ps(), { safeRe: n, t: a } = bt(), s = Xi(), o = Hr(), i = ye(), l = Te();
  return Kn;
}
var Hn, Zo;
function Xr() {
  if (Zo) return Hn;
  Zo = 1;
  const e = Te();
  return Hn = (r, n, a) => {
    try {
      n = new e(n, a);
    } catch {
      return !1;
    }
    return n.test(r);
  }, Hn;
}
var Bn, ei;
function Md() {
  if (ei) return Bn;
  ei = 1;
  const e = Te();
  return Bn = (r, n) => new e(r, n).set.map((a) => a.map((s) => s.value).join(" ").trim().split(" ")), Bn;
}
var Wn, ti;
function Ud() {
  if (ti) return Wn;
  ti = 1;
  const e = ye(), t = Te();
  return Wn = (n, a, s) => {
    let o = null, i = null, l = null;
    try {
      l = new t(a, s);
    } catch {
      return null;
    }
    return n.forEach((u) => {
      l.test(u) && (!o || i.compare(u) === -1) && (o = u, i = new e(o, s));
    }), o;
  }, Wn;
}
var Xn, ri;
function Fd() {
  if (ri) return Xn;
  ri = 1;
  const e = ye(), t = Te();
  return Xn = (n, a, s) => {
    let o = null, i = null, l = null;
    try {
      l = new t(a, s);
    } catch {
      return null;
    }
    return n.forEach((u) => {
      l.test(u) && (!o || i.compare(u) === 1) && (o = u, i = new e(o, s));
    }), o;
  }, Xn;
}
var Yn, ni;
function Vd() {
  if (ni) return Yn;
  ni = 1;
  const e = ye(), t = Te(), r = Br();
  return Yn = (a, s) => {
    a = new t(a, s);
    let o = new e("0.0.0");
    if (a.test(o) || (o = new e("0.0.0-0"), a.test(o)))
      return o;
    o = null;
    for (let i = 0; i < a.set.length; ++i) {
      const l = a.set[i];
      let u = null;
      l.forEach((c) => {
        const y = new e(c.semver.version);
        switch (c.operator) {
          case ">":
            y.prerelease.length === 0 ? y.patch++ : y.prerelease.push(0), y.raw = y.format();
          /* fallthrough */
          case "":
          case ">=":
            (!u || r(y, u)) && (u = y);
            break;
          case "<":
          case "<=":
            break;
          /* istanbul ignore next */
          default:
            throw new Error(`Unexpected operation: ${c.operator}`);
        }
      }), u && (!o || r(o, u)) && (o = u);
    }
    return o && a.test(o) ? o : null;
  }, Yn;
}
var Jn, si;
function zd() {
  if (si) return Jn;
  si = 1;
  const e = Te();
  return Jn = (r, n) => {
    try {
      return new e(r, n).range || "*";
    } catch {
      return null;
    }
  }, Jn;
}
var Qn, ai;
function As() {
  if (ai) return Qn;
  ai = 1;
  const e = ye(), t = Wr(), { ANY: r } = t, n = Te(), a = Xr(), s = Br(), o = Os(), i = Ns(), l = Ts();
  return Qn = (c, y, f, h) => {
    c = new e(c, h), y = new n(y, h);
    let $, _, p, v, d;
    switch (f) {
      case ">":
        $ = s, _ = i, p = o, v = ">", d = ">=";
        break;
      case "<":
        $ = o, _ = l, p = s, v = "<", d = "<=";
        break;
      default:
        throw new TypeError('Must provide a hilo val of "<" or ">"');
    }
    if (a(c, y, h))
      return !1;
    for (let g = 0; g < y.set.length; ++g) {
      const S = y.set[g];
      let m = null, E = null;
      if (S.forEach((b) => {
        b.semver === r && (b = new t(">=0.0.0")), m = m || b, E = E || b, $(b.semver, m.semver, h) ? m = b : p(b.semver, E.semver, h) && (E = b);
      }), m.operator === v || m.operator === d || (!E.operator || E.operator === v) && _(c, E.semver))
        return !1;
      if (E.operator === d && p(c, E.semver))
        return !1;
    }
    return !0;
  }, Qn;
}
var Zn, oi;
function Gd() {
  if (oi) return Zn;
  oi = 1;
  const e = As();
  return Zn = (r, n, a) => e(r, n, ">", a), Zn;
}
var es, ii;
function xd() {
  if (ii) return es;
  ii = 1;
  const e = As();
  return es = (r, n, a) => e(r, n, "<", a), es;
}
var ts, ci;
function Kd() {
  if (ci) return ts;
  ci = 1;
  const e = Te();
  return ts = (r, n, a) => (r = new e(r, a), n = new e(n, a), r.intersects(n, a)), ts;
}
var rs, ui;
function Hd() {
  if (ui) return rs;
  ui = 1;
  const e = Xr(), t = Oe();
  return rs = (r, n, a) => {
    const s = [];
    let o = null, i = null;
    const l = r.sort((f, h) => t(f, h, a));
    for (const f of l)
      e(f, n, a) ? (i = f, o || (o = f)) : (i && s.push([o, i]), i = null, o = null);
    o && s.push([o, null]);
    const u = [];
    for (const [f, h] of s)
      f === h ? u.push(f) : !h && f === l[0] ? u.push("*") : h ? f === l[0] ? u.push(`<=${h}`) : u.push(`${f} - ${h}`) : u.push(`>=${f}`);
    const c = u.join(" || "), y = typeof n.raw == "string" ? n.raw : String(n);
    return c.length < y.length ? c : n;
  }, rs;
}
var ns, li;
function Bd() {
  if (li) return ns;
  li = 1;
  const e = Te(), t = Wr(), { ANY: r } = t, n = Xr(), a = Oe(), s = (y, f, h = {}) => {
    if (y === f)
      return !0;
    y = new e(y, h), f = new e(f, h);
    let $ = !1;
    e: for (const _ of y.set) {
      for (const p of f.set) {
        const v = l(_, p, h);
        if ($ = $ || v !== null, v)
          continue e;
      }
      if ($)
        return !1;
    }
    return !0;
  }, o = [new t(">=0.0.0-0")], i = [new t(">=0.0.0")], l = (y, f, h) => {
    if (y === f)
      return !0;
    if (y.length === 1 && y[0].semver === r) {
      if (f.length === 1 && f[0].semver === r)
        return !0;
      h.includePrerelease ? y = o : y = i;
    }
    if (f.length === 1 && f[0].semver === r) {
      if (h.includePrerelease)
        return !0;
      f = i;
    }
    const $ = /* @__PURE__ */ new Set();
    let _, p;
    for (const T of y)
      T.operator === ">" || T.operator === ">=" ? _ = u(_, T, h) : T.operator === "<" || T.operator === "<=" ? p = c(p, T, h) : $.add(T.semver);
    if ($.size > 1)
      return null;
    let v;
    if (_ && p) {
      if (v = a(_.semver, p.semver, h), v > 0)
        return null;
      if (v === 0 && (_.operator !== ">=" || p.operator !== "<="))
        return null;
    }
    for (const T of $) {
      if (_ && !n(T, String(_), h) || p && !n(T, String(p), h))
        return null;
      for (const M of f)
        if (!n(T, String(M), h))
          return !1;
      return !0;
    }
    let d, g, S, m, E = p && !h.includePrerelease && p.semver.prerelease.length ? p.semver : !1, b = _ && !h.includePrerelease && _.semver.prerelease.length ? _.semver : !1;
    E && E.prerelease.length === 1 && p.operator === "<" && E.prerelease[0] === 0 && (E = !1);
    for (const T of f) {
      if (m = m || T.operator === ">" || T.operator === ">=", S = S || T.operator === "<" || T.operator === "<=", _) {
        if (b && T.semver.prerelease && T.semver.prerelease.length && T.semver.major === b.major && T.semver.minor === b.minor && T.semver.patch === b.patch && (b = !1), T.operator === ">" || T.operator === ">=") {
          if (d = u(_, T, h), d === T && d !== _)
            return !1;
        } else if (_.operator === ">=" && !n(_.semver, String(T), h))
          return !1;
      }
      if (p) {
        if (E && T.semver.prerelease && T.semver.prerelease.length && T.semver.major === E.major && T.semver.minor === E.minor && T.semver.patch === E.patch && (E = !1), T.operator === "<" || T.operator === "<=") {
          if (g = c(p, T, h), g === T && g !== p)
            return !1;
        } else if (p.operator === "<=" && !n(p.semver, String(T), h))
          return !1;
      }
      if (!T.operator && (p || _) && v !== 0)
        return !1;
    }
    return !(_ && S && !p && v !== 0 || p && m && !_ && v !== 0 || b || E);
  }, u = (y, f, h) => {
    if (!y)
      return f;
    const $ = a(y.semver, f.semver, h);
    return $ > 0 ? y : $ < 0 || f.operator === ">" && y.operator === ">=" ? f : y;
  }, c = (y, f, h) => {
    if (!y)
      return f;
    const $ = a(y.semver, f.semver, h);
    return $ < 0 ? y : $ > 0 || f.operator === "<" && y.operator === "<=" ? f : y;
  };
  return ns = s, ns;
}
var ss, di;
function Wd() {
  if (di) return ss;
  di = 1;
  const e = bt(), t = Kr(), r = ye(), n = Hi(), a = dt(), s = bd(), o = Rd(), i = Pd(), l = Id(), u = Od(), c = Td(), y = Nd(), f = Ad(), h = Oe(), $ = jd(), _ = kd(), p = Is(), v = Cd(), d = qd(), g = Br(), S = Os(), m = Bi(), E = Wi(), b = Ts(), T = Ns(), M = Xi(), z = Dd(), q = Wr(), F = Te(), G = Xr(), j = Md(), D = Ud(), H = Fd(), x = Vd(), V = zd(), K = As(), k = Gd(), P = xd(), A = Kd(), I = Hd(), w = Bd();
  return ss = {
    parse: a,
    valid: s,
    clean: o,
    inc: i,
    diff: l,
    major: u,
    minor: c,
    patch: y,
    prerelease: f,
    compare: h,
    rcompare: $,
    compareLoose: _,
    compareBuild: p,
    sort: v,
    rsort: d,
    gt: g,
    lt: S,
    eq: m,
    neq: E,
    gte: b,
    lte: T,
    cmp: M,
    coerce: z,
    Comparator: q,
    Range: F,
    satisfies: G,
    toComparators: j,
    maxSatisfying: D,
    minSatisfying: H,
    minVersion: x,
    validRange: V,
    outside: K,
    gtr: k,
    ltr: P,
    intersects: A,
    simplifyRange: I,
    subset: w,
    SemVer: r,
    re: e.re,
    src: e.src,
    tokens: e.t,
    SEMVER_SPEC_VERSION: t.SEMVER_SPEC_VERSION,
    RELEASE_TYPES: t.RELEASE_TYPES,
    compareIdentifiers: n.compareIdentifiers,
    rcompareIdentifiers: n.rcompareIdentifiers
  }, ss;
}
var Xd = Wd();
const tt = /* @__PURE__ */ Ti(Xd), Yd = Object.prototype.toString, Jd = "[object Uint8Array]", Qd = "[object ArrayBuffer]";
function Yi(e, t, r) {
  return e ? e.constructor === t ? !0 : Yd.call(e) === r : !1;
}
function Ji(e) {
  return Yi(e, Uint8Array, Jd);
}
function Zd(e) {
  return Yi(e, ArrayBuffer, Qd);
}
function ef(e) {
  return Ji(e) || Zd(e);
}
function tf(e) {
  if (!Ji(e))
    throw new TypeError(`Expected \`Uint8Array\`, got \`${typeof e}\``);
}
function rf(e) {
  if (!ef(e))
    throw new TypeError(`Expected \`Uint8Array\` or \`ArrayBuffer\`, got \`${typeof e}\``);
}
function fi(e, t) {
  if (e.length === 0)
    return new Uint8Array(0);
  t ??= e.reduce((a, s) => a + s.length, 0);
  const r = new Uint8Array(t);
  let n = 0;
  for (const a of e)
    tf(a), r.set(a, n), n += a.length;
  return r;
}
const pi = {
  utf8: new globalThis.TextDecoder("utf8")
};
function hi(e, t = "utf8") {
  return rf(e), pi[t] ??= new globalThis.TextDecoder(t), pi[t].decode(e);
}
function nf(e) {
  if (typeof e != "string")
    throw new TypeError(`Expected \`string\`, got \`${typeof e}\``);
}
const sf = new globalThis.TextEncoder();
function as(e) {
  return nf(e), sf.encode(e);
}
Array.from({ length: 256 }, (e, t) => t.toString(16).padStart(2, "0"));
const af = md.default, mi = "aes-256-cbc", rt = () => /* @__PURE__ */ Object.create(null), of = (e) => e != null, cf = (e, t) => {
  const r = /* @__PURE__ */ new Set([
    "undefined",
    "symbol",
    "function"
  ]), n = typeof t;
  if (r.has(n))
    throw new TypeError(`Setting a value of type \`${n}\` for key \`${e}\` is not allowed as it's not supported by JSON`);
}, Tr = "__internal__", os = `${Tr}.migrations.version`;
class uf {
  path;
  events;
  #n;
  #t;
  #e;
  #r = {};
  constructor(t = {}) {
    const r = {
      configName: "config",
      fileExtension: "json",
      projectSuffix: "nodejs",
      clearInvalidConfig: !1,
      accessPropertiesByDotNotation: !0,
      configFileMode: 438,
      ...t
    };
    if (!r.cwd) {
      if (!r.projectName)
        throw new Error("Please specify the `projectName` option.");
      r.cwd = Rc(r.projectName, { suffix: r.projectSuffix }).config;
    }
    if (this.#e = r, r.schema ?? r.ajvOptions ?? r.rootSchema) {
      if (r.schema && typeof r.schema != "object")
        throw new TypeError("The `schema` option must be an object.");
      const o = new td.Ajv2020({
        allErrors: !0,
        useDefaults: !0,
        ...r.ajvOptions
      });
      af(o);
      const i = {
        ...r.rootSchema,
        type: "object",
        properties: r.schema
      };
      this.#n = o.compile(i);
      for (const [l, u] of Object.entries(r.schema ?? {}))
        u?.default && (this.#r[l] = u.default);
    }
    r.defaults && (this.#r = {
      ...this.#r,
      ...r.defaults
    }), r.serialize && (this._serialize = r.serialize), r.deserialize && (this._deserialize = r.deserialize), this.events = new EventTarget(), this.#t = r.encryptionKey;
    const n = r.fileExtension ? `.${r.fileExtension}` : "";
    this.path = se.resolve(r.cwd, `${r.configName ?? "config"}${n}`);
    const a = this.store, s = Object.assign(rt(), r.defaults, a);
    if (r.migrations) {
      if (!r.projectVersion)
        throw new Error("Please specify the `projectVersion` option.");
      this._migrate(r.migrations, r.projectVersion, r.beforeEachMigration);
    }
    this._validate(s);
    try {
      hc.deepEqual(a, s);
    } catch {
      this.store = s;
    }
    r.watch && this._watch();
  }
  get(t, r) {
    if (this.#e.accessPropertiesByDotNotation)
      return this._get(t, r);
    const { store: n } = this;
    return t in n ? n[t] : r;
  }
  set(t, r) {
    if (typeof t != "string" && typeof t != "object")
      throw new TypeError(`Expected \`key\` to be of type \`string\` or \`object\`, got ${typeof t}`);
    if (typeof t != "object" && r === void 0)
      throw new TypeError("Use `delete()` to clear values");
    if (this._containsReservedKey(t))
      throw new TypeError(`Please don't use the ${Tr} key, as it's used to manage this module internal operations.`);
    const { store: n } = this, a = (s, o) => {
      cf(s, o), this.#e.accessPropertiesByDotNotation ? Ms(n, s, o) : n[s] = o;
    };
    if (typeof t == "object") {
      const s = t;
      for (const [o, i] of Object.entries(s))
        a(o, i);
    } else
      a(t, r);
    this.store = n;
  }
  has(t) {
    return this.#e.accessPropertiesByDotNotation ? Ec(this.store, t) : t in this.store;
  }
  /**
      Reset items to their default values, as defined by the `defaults` or `schema` option.
  
      @see `clear()` to reset all items.
  
      @param keys - The keys of the items to reset.
      */
  reset(...t) {
    for (const r of t)
      of(this.#r[r]) && this.set(r, this.#r[r]);
  }
  delete(t) {
    const { store: r } = this;
    this.#e.accessPropertiesByDotNotation ? $c(r, t) : delete r[t], this.store = r;
  }
  /**
      Delete all items.
  
      This resets known items to their default values, if defined by the `defaults` or `schema` option.
      */
  clear() {
    this.store = rt();
    for (const t of Object.keys(this.#r))
      this.reset(t);
  }
  onDidChange(t, r) {
    if (typeof t != "string")
      throw new TypeError(`Expected \`key\` to be of type \`string\`, got ${typeof t}`);
    if (typeof r != "function")
      throw new TypeError(`Expected \`callback\` to be of type \`function\`, got ${typeof r}`);
    return this._handleChange(() => this.get(t), r);
  }
  /**
      Watches the whole config object, calling `callback` on any changes.
  
      @param callback - A callback function that is called on any changes. When a `key` is first set `oldValue` will be `undefined`, and when a key is deleted `newValue` will be `undefined`.
      @returns A function, that when called, will unsubscribe.
      */
  onDidAnyChange(t) {
    if (typeof t != "function")
      throw new TypeError(`Expected \`callback\` to be of type \`function\`, got ${typeof t}`);
    return this._handleChange(() => this.store, t);
  }
  get size() {
    return Object.keys(this.store).length;
  }
  /**
      Get all the config as an object or replace the current config with an object.
  
      @example
      ```
      console.log(config.store);
      //=> {name: 'John', age: 30}
      ```
  
      @example
      ```
      config.store = {
          hello: 'world'
      };
      ```
      */
  get store() {
    try {
      const t = J.readFileSync(this.path, this.#t ? null : "utf8"), r = this._encryptData(t), n = this._deserialize(r);
      return this._validate(n), Object.assign(rt(), n);
    } catch (t) {
      if (t?.code === "ENOENT")
        return this._ensureDirectory(), rt();
      if (this.#e.clearInvalidConfig && t.name === "SyntaxError")
        return rt();
      throw t;
    }
  }
  set store(t) {
    this._ensureDirectory(), this._validate(t), this._write(t), this.events.dispatchEvent(new Event("change"));
  }
  *[Symbol.iterator]() {
    for (const [t, r] of Object.entries(this.store))
      yield [t, r];
  }
  _encryptData(t) {
    if (!this.#t)
      return typeof t == "string" ? t : hi(t);
    try {
      const r = t.slice(0, 16), n = pt.pbkdf2Sync(this.#t, r.toString(), 1e4, 32, "sha512"), a = pt.createDecipheriv(mi, n, r), s = t.slice(17), o = typeof s == "string" ? as(s) : s;
      return hi(fi([a.update(o), a.final()]));
    } catch {
    }
    return t.toString();
  }
  _handleChange(t, r) {
    let n = t();
    const a = () => {
      const s = n, o = t();
      pc(o, s) || (n = o, r.call(this, o, s));
    };
    return this.events.addEventListener("change", a), () => {
      this.events.removeEventListener("change", a);
    };
  }
  _deserialize = (t) => JSON.parse(t);
  _serialize = (t) => JSON.stringify(t, void 0, "	");
  _validate(t) {
    if (!this.#n || this.#n(t) || !this.#n.errors)
      return;
    const n = this.#n.errors.map(({ instancePath: a, message: s = "" }) => `\`${a.slice(1)}\` ${s}`);
    throw new Error("Config schema violation: " + n.join("; "));
  }
  _ensureDirectory() {
    J.mkdirSync(se.dirname(this.path), { recursive: !0 });
  }
  _write(t) {
    let r = this._serialize(t);
    if (this.#t) {
      const n = pt.randomBytes(16), a = pt.pbkdf2Sync(this.#t, n.toString(), 1e4, 32, "sha512"), s = pt.createCipheriv(mi, a, n);
      r = fi([n, as(":"), s.update(as(r)), s.final()]);
    }
    if (ae.env.SNAP)
      J.writeFileSync(this.path, r, { mode: this.#e.configFileMode });
    else
      try {
        Oi(this.path, r, { mode: this.#e.configFileMode });
      } catch (n) {
        if (n?.code === "EXDEV") {
          J.writeFileSync(this.path, r, { mode: this.#e.configFileMode });
          return;
        }
        throw n;
      }
  }
  _watch() {
    this._ensureDirectory(), J.existsSync(this.path) || this._write(rt()), ae.platform === "win32" ? J.watch(this.path, { persistent: !1 }, $o(() => {
      this.events.dispatchEvent(new Event("change"));
    }, { wait: 100 })) : J.watchFile(this.path, { persistent: !1 }, $o(() => {
      this.events.dispatchEvent(new Event("change"));
    }, { wait: 5e3 }));
  }
  _migrate(t, r, n) {
    let a = this._get(os, "0.0.0");
    const s = Object.keys(t).filter((i) => this._shouldPerformMigration(i, a, r));
    let o = { ...this.store };
    for (const i of s)
      try {
        n && n(this, {
          fromVersion: a,
          toVersion: i,
          finalVersion: r,
          versions: s
        });
        const l = t[i];
        l?.(this), this._set(os, i), a = i, o = { ...this.store };
      } catch (l) {
        throw this.store = o, new Error(`Something went wrong during the migration! Changes applied to the store until this failed migration will be restored. ${l}`);
      }
    (this._isVersionInRangeFormat(a) || !tt.eq(a, r)) && this._set(os, r);
  }
  _containsReservedKey(t) {
    return typeof t == "object" && Object.keys(t)[0] === Tr ? !0 : typeof t != "string" ? !1 : this.#e.accessPropertiesByDotNotation ? !!t.startsWith(`${Tr}.`) : !1;
  }
  _isVersionInRangeFormat(t) {
    return tt.clean(t) === null;
  }
  _shouldPerformMigration(t, r, n) {
    return this._isVersionInRangeFormat(t) ? r !== "0.0.0" && tt.satisfies(r, t) ? !1 : tt.satisfies(n, t) : !(tt.lte(t, r) || tt.gt(t, n));
  }
  _get(t, r) {
    return _c(this.store, t, r);
  }
  _set(t, r) {
    const { store: n } = this;
    Ms(n, t, r), this.store = n;
  }
}
const { app: Nr, ipcMain: hs, shell: lf } = ms;
let yi = !1;
const gi = () => {
  if (!hs || !Nr)
    throw new Error("Electron Store: You need to call `.initRenderer()` from the main process.");
  const e = {
    defaultCwd: Nr.getPath("userData"),
    appVersion: Nr.getVersion()
  };
  return yi || (hs.on("electron-store-get-data", (t) => {
    t.returnValue = e;
  }), yi = !0), e;
};
class Qi extends uf {
  constructor(t) {
    let r, n;
    if (ae.type === "renderer") {
      const a = ms.ipcRenderer.sendSync("electron-store-get-data");
      if (!a)
        throw new Error("Electron Store: You need to call `.initRenderer()` from the main process.");
      ({ defaultCwd: r, appVersion: n } = a);
    } else hs && Nr && ({ defaultCwd: r, appVersion: n } = gi());
    t = {
      name: "config",
      ...t
    }, t.projectVersion ||= n, t.cwd ? t.cwd = se.isAbsolute(t.cwd) ? t.cwd : se.join(r, t.cwd) : t.cwd = r, t.configName = t.name, delete t.name, super(t);
  }
  static initRenderer() {
    gi();
  }
  async openInEditor() {
    const t = await lf.openPath(this.path);
    if (t)
      throw new Error(t);
  }
}
const ot = new Qi({ projectName: "sofia", name: "settings" }), $t = new Qi({ projectName: "sofia", name: "secrets", encryptionKey: "sofia-3.0-enc" });
function vi() {
  if (ot.get("initialized")) return;
  const e = De(process.cwd(), ".env");
  if (ys(e))
    try {
      const r = gs(e, "utf-8").split(`
`), n = {
        OPENAI_API_KEY: "openai",
        ANTHROPIC_API_KEY: "anthropic",
        OPENROUTER_API_KEY: "openrouter",
        G4F_API_KEY: "g4f",
        GROQ_API_KEY: "groq",
        DEEPGRAM_API_KEY: "deepgram",
        GEMINI_API_KEY: "gemini",
        DEEPSEEK_API_KEY: "deepseek",
        XAI_API_KEY: "xai",
        KIMI_API_KEY: "kimi",
        QWEN_API_KEY: "qwen",
        DATABASE_URL: "neon_url",
        NEON_API_KEY: "neon_api",
        OPENCLAW_AUTH_TOKEN: "openclaw",
        OPENCLAW_BASE_URL: "openclaw_url"
      };
      for (const a of r) {
        const s = a.trim();
        if (!s || s.startsWith("#")) continue;
        const o = s.indexOf("=");
        if (o === -1) continue;
        const i = s.slice(0, o), l = s.slice(o + 1), u = n[i];
        if (u && l)
          if (ut.isEncryptionAvailable()) {
            const c = ut.encryptString(l).toString("base64");
            $t.set(u, c);
          } else
            $t.set(u, l);
      }
      ot.set("initialized", !0), console.log("[Settings] Initial credentials loaded from .env");
    } catch (t) {
      console.error("[Settings] Failed to load .env:", t);
    }
}
function ie(e) {
  const t = $t.get(e);
  if (!t) return null;
  try {
    return ut.isEncryptionAvailable() ? ut.decryptString(Buffer.from(t, "base64")) : t;
  } catch {
    return null;
  }
}
function df(e, t) {
  if (ut.isEncryptionAvailable()) {
    const r = ut.encryptString(t).toString("base64");
    $t.set(e, r);
  } else
    $t.set(e, t);
}
function ff(e) {
  vi(), e.handle("settings:get", (t, r) => ot.get(r) ?? null), e.handle("settings:set", (t, r, n) => {
    ot.set(r, n);
  }), e.handle("settings:get-secret", (t, r) => ie(r)), e.handle("settings:set-secret", (t, r, n) => {
    df(r, n);
  }), e.handle("settings:get-all-keys", () => {
    const t = [
      "openai",
      "anthropic",
      "openrouter",
      "g4f",
      "groq",
      "deepgram",
      "gemini",
      "deepseek",
      "xai",
      "kimi",
      "qwen",
      "neon_url",
      "neon_api",
      "openclaw",
      "openclaw_url"
    ], r = {};
    for (const n of t)
      r[n] = !!ie(n);
    return r;
  }), e.handle("settings:get-all", () => ot.store), e.handle("settings:reset-keys", () => (ot.delete("initialized"), vi(), !0));
}
let Ve = null;
const pf = /* @__PURE__ */ new Map();
function hf(e, t) {
  const r = t === 429 ? 12e4 : t === 401 || t === 403 ? 18e5 : 3e4;
  pf.set(e, Date.now() + r);
}
const Cr = {
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  groq: "https://api.groq.com/openai/v1",
  deepseek: "https://api.deepseek.com/v1",
  xai: "https://api.x.ai/v1",
  kimi: "https://api.moonshot.cn/v1",
  qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  openclaw: "http://localhost:8098/v1"
};
function Zi(e) {
  return e === "openai" ? "OpenAI en SOFÍA 3.0 requiere login interactivo de ChatGPT Plus dentro de OpenClaw. Esta ruta no usa API key directa." : e === "anthropic" ? "Anthropic en SOFÍA 3.0 requiere login interactivo de Claude Pro dentro de OpenClaw. Esta ruta no usa API key directa." : "Esta ruta requiere autenticacion interactiva dentro de OpenClaw.";
}
function qr(e) {
  return e === "openclaw-openai" ? "OpenAI (ChatGPT Plus) requiere confirmacion interactiva en OpenClaw antes de responder. Esta lane no usa API key directa." : e === "openclaw-anthropic" ? "Anthropic (Claude Pro) requiere confirmacion interactiva en OpenClaw antes de responder. Esta lane no usa x-api-key directa." : "Esta lane requiere autenticacion interactiva en OpenClaw.";
}
function mf(e, t, r, n) {
  if (e === "openclaw" && (n.includes("NoValidHarFileError") || n.includes("MissingAuthError"))) {
    if (t === "openclaw-openai" || t.startsWith("gpt-"))
      return qr("openclaw-openai");
    if (t === "openclaw-anthropic" || t.startsWith("claude-"))
      return qr("openclaw-anthropic");
  }
  return `${e} ${r}: ${n.slice(0, 200)}`;
}
function ec(e, t) {
  const r = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${t}`
  };
  return e === "openrouter" && (r["HTTP-Referer"] = "https://sofia.app", r["X-Title"] = "SOFIA"), e === "openclaw" && (r.Authorization = `Bearer ${ie("openclaw") || t}`), r;
}
async function tc(e, t, r, n) {
  if (e === "openai" || e === "anthropic") {
    r.webContents.send("chat:chunk", { type: "error", error: Zi(e) });
    return;
  }
  const s = ie(e === "openclaw" ? "openclaw" : e);
  if (!s && e !== "openclaw" && e !== "g4f") {
    r.webContents.send("chat:chunk", { type: "error", error: `Sin clave API para ${e}` });
    return;
  }
  const o = t.baseUrl || Cr[e] || Cr.openai, i = ec(e, s || ""), l = {
    model: t.model,
    messages: t.messages,
    stream: !0,
    max_tokens: t.maxTokens || 4096
  };
  t.tools?.length && (l.tools = t.tools.map((u) => ({
    type: "function",
    function: { name: u.name, description: u.description, parameters: u.parameters }
  })), l.tool_choice = "auto"), t.temperature !== void 0 && (l.temperature = t.temperature);
  try {
    const u = await fetch(`${o}/chat/completions`, {
      method: "POST",
      headers: i,
      body: JSON.stringify(l),
      signal: n
    });
    if (!u.ok) {
      const $ = await u.text();
      if (console.error(`[chat:${e}] HTTP ${u.status} → ${o}/chat/completions
`, $.slice(0, 300)), e === "g4f" && u.status !== 400 && t.model !== "openai") {
        const _ = t.providerName;
        return _ && hf(_, u.status), tc(e, { ...t, model: "openai", baseUrl: "http://localhost:8080/v1" }, r, n);
      }
      r.webContents.send("chat:chunk", {
        type: "error",
        error: mf(e, t.model, u.status, $)
      });
      return;
    }
    const c = u.body.getReader(), y = new TextDecoder();
    let f = "";
    const h = {};
    for (; ; ) {
      const { done: $, value: _ } = await c.read();
      if ($) break;
      f += y.decode(_, { stream: !0 });
      const p = f.split(`
`);
      f = p.pop() ?? "";
      for (const v of p) {
        if (!v.startsWith("data: ")) continue;
        const d = v.slice(6).trim();
        if (d === "[DONE]") {
          for (const g of Object.values(h))
            if (g.args)
              try {
                r.webContents.send("chat:chunk", { type: "tool_call_end", toolCallId: g.id, toolArgs: JSON.parse(g.args) });
              } catch {
              }
          r.webContents.send("chat:chunk", { type: "done" });
          return;
        }
        try {
          const S = JSON.parse(d).choices?.[0]?.delta;
          if (!S) continue;
          if (S.content && r.webContents.send("chat:chunk", { type: "text", text: S.content }), S.tool_calls)
            for (const m of S.tool_calls) {
              const E = m.index ?? 0;
              h[E] || (h[E] = { id: m.id ?? `tc_${E}`, name: m.function?.name ?? "", args: "" }, r.webContents.send("chat:chunk", { type: "tool_call_start", toolCallId: h[E].id, toolName: h[E].name })), m.function?.arguments && (h[E].args += m.function.arguments, r.webContents.send("chat:chunk", { type: "tool_call_delta", toolCallId: h[E].id, toolArgsDelta: m.function.arguments }));
            }
        } catch {
        }
      }
    }
    r.webContents.send("chat:chunk", { type: "done" });
  } catch (u) {
    if (u.name === "AbortError") return;
    const y = u.cause?.code === "ECONNREFUSED" || u.message?.includes("ECONNREFUSED") ? `[${e}] Servidor local no responde en ${o} — ¿está corriendo el servicio?` : u.message;
    console.error(`[chat:${e}] FETCH ERROR → ${o}:`, u.message), r.webContents.send("chat:chunk", { type: "error", error: y });
  }
}
async function yf(e, t, r) {
  const n = ie("gemini");
  if (!n) {
    t.webContents.send("chat:chunk", { type: "error", error: "Sin clave API de Gemini" });
    return;
  }
  const a = e.messages.filter((i) => i.role !== "system").map((i) => ({
    role: i.role === "assistant" ? "model" : "user",
    parts: [{ text: typeof i.content == "string" ? i.content : JSON.stringify(i.content) }]
  })), s = e.messages.find((i) => i.role === "system"), o = { contents: a };
  s && (o.systemInstruction = { parts: [{ text: s.content }] }), o.generationConfig = { maxOutputTokens: e.maxTokens || 4096 };
  try {
    const i = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${e.model}:streamGenerateContent?alt=sse&key=${n}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(o),
        signal: r
      }
    );
    if (!i.ok) {
      const y = await i.text();
      t.webContents.send("chat:chunk", { type: "error", error: `Gemini ${i.status}: ${y}` });
      return;
    }
    const l = i.body.getReader(), u = new TextDecoder();
    let c = "";
    for (; ; ) {
      const { done: y, value: f } = await l.read();
      if (y) break;
      c += u.decode(f, { stream: !0 });
      const h = c.split(`
`);
      c = h.pop() ?? "";
      for (const $ of h)
        if ($.startsWith("data: "))
          try {
            const p = JSON.parse($.slice(6)).candidates?.[0]?.content?.parts?.[0]?.text;
            p && t.webContents.send("chat:chunk", { type: "text", text: p });
          } catch {
          }
    }
    t.webContents.send("chat:chunk", { type: "done" });
  } catch (i) {
    if (i.name === "AbortError") return;
    t.webContents.send("chat:chunk", { type: "error", error: i.message });
  }
}
function gf(e, t) {
  e.handle("chat:send", async (r, n) => {
    Ve = new AbortController();
    let { provider: a } = n;
    if (a === "g4f" && (n = { ...n, baseUrl: "http://localhost:8080/v1" }), a === "openclaw")
      if (n.model === "openclaw-anthropic") {
        t.webContents.send("chat:chunk", { type: "error", error: qr("openclaw-anthropic") }), Ve = null;
        return;
      } else if (n.model === "openclaw-openai") {
        t.webContents.send("chat:chunk", { type: "error", error: qr("openclaw-openai") }), Ve = null;
        return;
      } else n.model === "openclaw-openrouter" ? n = { ...n, model: "openrouter/auto", baseUrl: "http://localhost:8098/v1" } : n.model === "openclaw-g4f" ? (a = "g4f", n = { ...n, model: "gpt-4o", baseUrl: "http://localhost:8080/v1" }) : n.model === "deepseek-chat" ? n = { ...n, model: "deepseek-chat", baseUrl: "http://localhost:8098/v1" } : n.model === "deepseek-reasoner" ? n = { ...n, model: "deepseek-reasoner", baseUrl: "http://localhost:8098/v1" } : n = { ...n, baseUrl: "http://localhost:8098/v1" };
    a === "anthropic" ? t.webContents.send("chat:chunk", { type: "error", error: Zi("anthropic") }) : a === "gemini" ? await yf(n, t, Ve.signal) : await tc(a, n, t, Ve.signal), Ve = null;
  }), e.handle("chat:extract-memory", async (r, n) => {
    const a = new AbortController(), { provider: s } = n, o = (i) => {
      t.webContents.send("chat:extract-chunk", i);
    };
    s === "anthropic" ? await _f(n, o, a.signal) : s === "gemini" ? await $f(n, o, a.signal) : await vf(s, n, o, a.signal);
  }), e.handle("chat:abort", () => {
    Ve?.abort(), Ve = null;
  });
}
async function vf(e, t, r, n) {
  const s = ie(e === "openclaw" ? "openclaw" : e);
  if (!s && e !== "openclaw" && e !== "g4f") {
    r({ type: "error", error: `Sin clave API para ${e}` });
    return;
  }
  const o = t.baseUrl || Cr[e] || Cr.openai, i = ec(e, s || ""), l = {
    model: t.model,
    messages: t.messages,
    stream: !0,
    max_tokens: t.maxTokens || 4096
  };
  try {
    const u = await fetch(`${o}/chat/completions`, {
      method: "POST",
      headers: i,
      body: JSON.stringify(l),
      signal: n
    });
    if (!u.ok) {
      const h = await u.text();
      r({ type: "error", error: `${e} ${u.status}: ${h}` });
      return;
    }
    const c = u.body.getReader(), y = new TextDecoder();
    let f = "";
    for (; ; ) {
      const { done: h, value: $ } = await c.read();
      if (h) break;
      f += y.decode($, { stream: !0 });
      const _ = f.split(`
`);
      f = _.pop() ?? "";
      for (const p of _) {
        if (!p.startsWith("data: ")) continue;
        const v = p.slice(6).trim();
        if (v === "[DONE]") {
          r({ type: "done" });
          return;
        }
        try {
          const g = JSON.parse(v).choices?.[0]?.delta?.content;
          g && r({ type: "text", text: g });
        } catch {
        }
      }
    }
    r({ type: "done" });
  } catch (u) {
    if (u.name === "AbortError") return;
    const y = u.cause?.code === "ECONNREFUSED" || u.message?.includes("ECONNREFUSED") ? `[${e}] Servidor local no responde — ¿está corriendo el servicio?` : u.message;
    console.error(`[memory:${e}] FETCH ERROR:`, u.message), r({ type: "error", error: y });
  }
}
async function _f(e, t, r) {
  const n = ie("anthropic");
  if (!n) {
    t({ type: "error", error: "Sin clave API de Anthropic" });
    return;
  }
  const a = e.messages.filter((i) => i.role !== "system"), s = e.messages.find((i) => i.role === "system"), o = {
    model: e.model,
    max_tokens: e.maxTokens || 4096,
    messages: a,
    stream: !0
  };
  s && (o.system = s.content);
  try {
    const i = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": n,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(o),
      signal: r
    });
    if (!i.ok) {
      const y = await i.text();
      t({ type: "error", error: `Anthropic ${i.status}: ${y}` });
      return;
    }
    const l = i.body.getReader(), u = new TextDecoder();
    let c = "";
    for (; ; ) {
      const { done: y, value: f } = await l.read();
      if (y) break;
      c += u.decode(f, { stream: !0 });
      const h = c.split(`
`);
      c = h.pop() ?? "";
      for (const $ of h) {
        if (!$.startsWith("data: ")) continue;
        const _ = $.slice(6).trim();
        try {
          const p = JSON.parse(_);
          if (p.type === "content_block_delta" && p.delta?.type === "text_delta")
            t({ type: "text", text: p.delta.text });
          else if (p.type === "message_stop") {
            t({ type: "done" });
            return;
          }
        } catch {
        }
      }
    }
    t({ type: "done" });
  } catch (i) {
    if (i.name === "AbortError") return;
    t({ type: "error", error: i.message });
  }
}
async function $f(e, t, r) {
  const n = ie("gemini");
  if (!n) {
    t({ type: "error", error: "Sin clave API de Gemini" });
    return;
  }
  const a = e.messages.filter((s) => s.role !== "system").map((s) => ({
    role: s.role === "assistant" ? "model" : "user",
    parts: [{ text: typeof s.content == "string" ? s.content : JSON.stringify(s.content) }]
  }));
  try {
    const s = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${n}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: a }),
      signal: r
    });
    if (!s.ok) {
      const u = await s.text();
      t({ type: "error", error: `Gemini ${s.status}: ${u}` });
      return;
    }
    const o = s.body.getReader(), i = new TextDecoder();
    let l = "";
    for (; ; ) {
      const { done: u, value: c } = await o.read();
      if (u) break;
      l += i.decode(c, { stream: !0 });
      const y = l.split(`
`);
      l = y.pop() ?? "";
      for (const f of y)
        if (f.startsWith("data:"))
          try {
            const $ = JSON.parse(f.slice(5))?.candidates?.[0]?.content?.parts?.[0]?.text;
            $ && t({ type: "text", text: $ });
          } catch {
          }
    }
    t({ type: "done" });
  } catch (s) {
    if (s.name === "AbortError") return;
    t({ type: "error", error: s.message });
  }
}
let gt = null;
const lt = Re(process.env.USERPROFILE || "C:\\Users\\clayt", "Desktop", "generated_media"), rc = De(lt, "voice-callback-queue.json"), Ef = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".webp"]), wf = /* @__PURE__ */ new Set([".mp4", ".webm", ".mov", ".mkv"]);
function js() {
  ys(lt) || vs(lt, { recursive: !0 });
}
function Sf(e, t) {
  try {
    return JSON.parse(gs(e, "utf8"));
  } catch {
    return t;
  }
}
function bf(e, t) {
  js(), _s(e, JSON.stringify(t, null, 2), "utf8");
}
function vt() {
  return js(), Sf(rc, []);
}
function is(e) {
  bf(rc, e);
}
function cs(e) {
  return uc(e).href;
}
function Rf() {
  return js(), mc(lt).map((e) => {
    const t = De(lt, e), r = yc(t);
    return {
      name: e,
      filePath: t,
      extension: dc(e).toLowerCase(),
      lastModified: r.mtimeMs,
      size: r.size,
      isFile: r.isFile()
    };
  }).filter((e) => e.isFile).sort((e, t) => t.lastModified - e.lastModified);
}
function _i() {
  const e = Rf(), t = e.filter((s) => Ef.has(s.extension)), r = e.filter((s) => wf.has(s.extension)), n = [], a = /* @__PURE__ */ new Set();
  for (const s of r.slice(0, 8)) {
    const o = t.find((i) => !a.has(i.filePath)) || t[0];
    o && a.add(o.filePath), n.push({
      id: `scene-${Rt(s.name, s.extension)}`,
      label: Rt(s.name, s.extension),
      imagePath: o?.filePath ?? null,
      imageUrl: o ? cs(o.filePath) : null,
      videoPath: s.filePath,
      videoUrl: cs(s.filePath),
      updatedAt: Math.max(s.lastModified, o?.lastModified ?? 0),
      source: "generated_media"
    });
  }
  if (n.length === 0 && t.length > 0) {
    const s = t[0];
    n.push({
      id: `scene-${Rt(s.name, s.extension)}`,
      label: Rt(s.name, s.extension),
      imagePath: s.filePath,
      imageUrl: cs(s.filePath),
      videoPath: null,
      videoUrl: null,
      updatedAt: s.lastModified,
      source: "generated_media"
    });
  }
  return n.sort((s, o) => Number(o.updatedAt) - Number(s.updatedAt));
}
async function Pf() {
  try {
    const e = await fetch("http://127.0.0.1:8098/health");
    return e.ok ? { online: !0, details: await e.json() } : { online: !1, details: `${e.status}` };
  } catch (e) {
    return { online: !1, details: e?.message || "gateway-offline" };
  }
}
function nt(e) {
  return {
    id: String(e?.id || `callback-${Date.now()}`),
    actor: String(e?.actor || "sandra").toLowerCase() === "sofia" ? "sofia" : "sandra",
    mode: String(e?.mode || "voice").toLowerCase() === "avatar" ? "avatar" : "voice",
    reason: String(e?.reason || e?.description || "Seguimiento pendiente").trim(),
    sceneId: e?.sceneId ? String(e.sceneId) : null,
    source: String(e?.source || "manual"),
    voiceSessionId: e?.voiceSessionId ? String(e.voiceSessionId) : null,
    status: String(e?.status || "pending"),
    createdAt: Number(e?.createdAt || Date.now()),
    readyAt: Number(e?.readyAt || Date.now())
  };
}
function If(e, t) {
  e.handle("voice:get-deepgram-key", () => ie("deepgram")), e.handle("voice:get-runtime-state", async () => {
    const r = await Pf(), n = vt().map(nt), a = _i();
    return {
      gatewayOnline: r.online,
      gateway: r.details,
      deepgramConfigured: !!ie("deepgram"),
      generatedMediaDir: lt,
      callbackQueueSize: n.filter((s) => s.status !== "completed" && s.status !== "dismissed").length,
      avatarSceneCount: a.length,
      latestScene: a[0] ?? null
    };
  }), e.handle("voice:list-avatar-scenes", async () => ({ scenes: _i() })), e.handle("voice:list-callbacks", async () => ({ callbacks: vt().map(nt).sort((r, n) => n.createdAt - r.createdAt) })), e.handle("voice:queue-callback", async (r, n) => {
    const a = vt().map(nt), s = nt({
      ...n,
      id: n?.id || `callback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "pending",
      createdAt: Date.now(),
      readyAt: Date.now() + Number(n?.delayMs || 4e3)
    });
    return a.unshift(s), is(a), s;
  }), e.handle("voice:dequeue-ready-callback", async () => {
    const r = vt().map(nt), n = r.find((a) => a.status === "pending" && a.readyAt <= Date.now());
    return n ? (n.status = "ringing", is(r), n) : null;
  }), e.handle("voice:update-callback-status", async (r, n) => {
    const a = vt().map(nt), s = a.find((o) => o.id === n.id);
    return s ? (s.status = String(n.status || "completed"), is(a), !0) : !1;
  }), e.handle("voice:send-to-llm", async (r, n) => {
    gt = new AbortController();
    const a = n.provider || "deepseek", o = ie(a === "openclaw" ? "openclaw" : a);
    if (!o && a !== "openclaw") {
      t.webContents.send("voice:llm-chunk", { type: "error", error: `Sin clave API para ${a}` });
      return;
    }
    const i = {
      openai: "https://api.openai.com/v1",
      openrouter: "https://openrouter.ai/api/v1",
      groq: "https://api.groq.com/openai/v1",
      deepseek: "https://api.deepseek.com/v1",
      xai: "https://api.x.ai/v1",
      openclaw: "http://localhost:8098/v1"
    }, l = i[a] || i.openai, u = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${o}`
    }, c = {
      model: n.model || "deepseek-chat",
      messages: n.messages,
      stream: !0,
      max_tokens: n.maxTokens || 300
    };
    try {
      const y = await fetch(`${l}/chat/completions`, {
        method: "POST",
        headers: u,
        body: JSON.stringify(c),
        signal: gt.signal
      });
      if (!y.ok) {
        const _ = await y.text();
        t.webContents.send("voice:llm-chunk", { type: "error", error: `${a} ${y.status}: ${_}` });
        return;
      }
      const f = y.body.getReader(), h = new TextDecoder();
      let $ = "";
      for (; ; ) {
        const { done: _, value: p } = await f.read();
        if (_) break;
        $ += h.decode(p, { stream: !0 });
        const v = $.split(`
`);
        $ = v.pop() ?? "";
        for (const d of v) {
          if (!d.startsWith("data: ")) continue;
          const g = d.slice(6).trim();
          if (g === "[DONE]") {
            t.webContents.send("voice:llm-chunk", { type: "done" });
            return;
          }
          try {
            const m = JSON.parse(g).choices?.[0]?.delta?.content;
            m && t.webContents.send("voice:llm-chunk", { type: "text", text: m });
          } catch {
          }
        }
      }
      t.webContents.send("voice:llm-chunk", { type: "done" });
    } catch (y) {
      if (y.name === "AbortError") return;
      t.webContents.send("voice:llm-chunk", { type: "error", error: y.message });
    } finally {
      gt = null;
    }
  }), e.handle("voice:abort-llm", () => {
    gt?.abort(), gt = null;
  }), e.handle("voice:tts", async (r, { text: n }) => {
    const a = ie("deepgram");
    if (!a) return null;
    try {
      const s = await fetch(
        "https://api.deepgram.com/v1/speak?model=aura-2-carina-es&encoding=mp3",
        {
          method: "POST",
          headers: { Authorization: `Token ${a}`, "Content-Type": "application/json" },
          body: JSON.stringify({ text: n })
        }
      );
      if (!s.ok)
        return console.error(`[TTS] ${s.status}: ${await s.text()}`), null;
      const o = await s.arrayBuffer();
      return Buffer.from(o).toString("base64");
    } catch (s) {
      return console.error("[TTS] Error:", s.message), null;
    }
  });
}
let Pr = null;
async function Ne() {
  if (Pr) return Pr;
  const e = ie("neon_url");
  if (!e) return null;
  try {
    const { neon: t } = await import("./index-ClqdjTL1.js");
    return Pr = t(e), Pr;
  } catch (t) {
    return console.error("[Memory] Failed to connect to Neon:", t), null;
  }
}
function Of(e) {
  e.handle("memory:init-schema", async () => {
    const t = await Ne();
    if (!t) return { ok: !1, error: "No database connection" };
    try {
      return await t`CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY,
        title TEXT,
        provider TEXT NOT NULL DEFAULT 'openrouter',
        model TEXT NOT NULL DEFAULT 'auto',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )`, await t`CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY,
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content_json TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      )`, await t`CREATE TABLE IF NOT EXISTS agent_memory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category VARCHAR(50) NOT NULL,
        key VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        source_conversation_id UUID,
        confidence REAL DEFAULT 1.0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(category, key)
      )`, console.log("[Memory] Schema initialized"), { ok: !0 };
    } catch (r) {
      return console.error("[Memory] Schema init failed:", r), { ok: !1, error: r.message };
    }
  }), e.handle("memory:conversations", async (t, r = 50) => {
    const n = await Ne();
    if (!n) return [];
    try {
      return await n`SELECT * FROM conversations ORDER BY updated_at DESC LIMIT ${r}`;
    } catch {
      return [];
    }
  }), e.handle("memory:create-conversation", async (t, r) => {
    const n = await Ne();
    if (!n) return null;
    try {
      return (await n`INSERT INTO conversations (id, title, provider, model) VALUES (${r.id}, ${r.title}, ${r.provider}, ${r.model}) RETURNING *`)[0];
    } catch (a) {
      return console.error("[Memory] Create conversation failed:", a), null;
    }
  }), e.handle("memory:delete-conversation", async (t, r) => {
    const n = await Ne();
    if (!n) return !1;
    try {
      return await n`DELETE FROM conversations WHERE id = ${r}`, !0;
    } catch {
      return !1;
    }
  }), e.handle("memory:update-title", async (t, r, n) => {
    const a = await Ne();
    if (!a) return !1;
    try {
      return await a`UPDATE conversations SET title = ${n}, updated_at = now() WHERE id = ${r}`, !0;
    } catch {
      return !1;
    }
  }), e.handle("memory:messages", async (t, r) => {
    const n = await Ne();
    if (!n) return [];
    try {
      return await n`SELECT id, conversation_id, role, content_json, created_at FROM messages WHERE conversation_id = ${r} ORDER BY created_at ASC`;
    } catch {
      try {
        return await n`SELECT id, conversation_id, role, content AS content_json, created_at FROM messages WHERE conversation_id = ${r} ORDER BY created_at ASC`;
      } catch {
        return [];
      }
    }
  }), e.handle("memory:save-message", async (t, r) => {
    const n = await Ne();
    if (!n) return null;
    try {
      return await n`INSERT INTO messages (id, conversation_id, role, content_json) VALUES (${r.id}, ${r.conversationId}, ${r.role}, ${r.content})`, await n`UPDATE conversations SET updated_at = now() WHERE id = ${r.conversationId}`, !0;
    } catch {
      try {
        return await n`INSERT INTO messages (id, conversation_id, role, content) VALUES (${r.id}, ${r.conversationId}, ${r.role}, ${r.content})`, await n`UPDATE conversations SET updated_at = now() WHERE id = ${r.conversationId}`, !0;
      } catch (a) {
        return console.error("[Memory] Save message failed:", a), null;
      }
    }
  }), e.handle("memory:get-all", async () => {
    const t = await Ne();
    if (!t) return [];
    try {
      return await t`SELECT * FROM agent_memory WHERE is_active = true ORDER BY category, updated_at DESC`;
    } catch {
      return [];
    }
  }), e.handle("memory:save", async (t, r) => {
    const n = await Ne();
    if (!n) return !1;
    try {
      return await n`INSERT INTO agent_memory (category, key, content, source_conversation_id, confidence)
        VALUES (${r.category}, ${r.key}, ${r.content}, ${r.source_conversation_id || null}, ${r.confidence || 1})
        ON CONFLICT (category, key) DO UPDATE SET
          content = EXCLUDED.content,
          source_conversation_id = EXCLUDED.source_conversation_id,
          confidence = EXCLUDED.confidence,
          updated_at = now()`, !0;
    } catch (a) {
      return console.error("[Memory] Save memory failed:", a), !1;
    }
  }), e.handle("memory:format-for-prompt", async () => {
    const t = await Ne();
    if (!t) return "";
    try {
      const r = await t`SELECT * FROM agent_memory WHERE is_active = true ORDER BY category, updated_at DESC`;
      if (!r.length) return "";
      const n = {};
      for (const i of r)
        n[i.category] || (n[i.category] = []), n[i.category].push({ key: i.key, content: i.content });
      const a = {
        session_state: "Estado actual de trabajo",
        instruction: "Instrucciones permanentes de Clay",
        task_pending: "Tareas pendientes",
        task_completed: "Tareas completadas",
        project: "Proyectos",
        preference: "Preferencias de Clay",
        fact: "Hechos conocidos",
        person: "Personas relevantes",
        decision: "Decisiones tomadas",
        workflow: "Flujos de trabajo"
      }, s = ["session_state", "instruction", "task_pending", "project", "preference", "fact", "person", "decision", "task_completed", "workflow"];
      let o = `

## Mi memoria persistente
`;
      for (const i of s)
        if (n[i]) {
          o += `
### ${a[i] || i}
`;
          for (const l of n[i])
            o += `- **${l.key}**: ${l.content}
`;
        }
      return o;
    } catch {
      return "";
    }
  });
}
const Ke = "http://127.0.0.1:8098", Yr = "sofia-oc-2026-k9x7m", $i = "http://127.0.0.1:3001", Ei = "http://127.0.0.1:8089", Ge = "http://127.0.0.1:8080", wi = "http://127.0.0.1:18789", us = "http://127.0.0.1:18790";
let Tf = 1;
const ks = Re(process.cwd(), "resources", "openclaw-control"), ls = Re(ks, "editor-mcp-inventory.json"), ds = Re(ks, "openclaw-library-index.json"), fs = Re(ks, "memory-policy.json"), Cs = Re(process.env.USERPROFILE || "C:\\Users\\clayt", "Desktop", "generated_media"), Ir = Re(process.env.USERPROFILE || "C:\\Users\\clayt", "Desktop", "SOFÍA AI", "sofia-ai"), Nf = [
  Re(Ir, "g4f-data", "har_and_cookies", "models", "2026-03-01", "https_gen.pollinations.ai_text_models.json"),
  Re(Ir, "g4f-data", "har_and_cookies", "models", "2026-03-01", "https_g4f.space_api_pollinations_models.json"),
  Re(Ir, "g4f-data", "har_and_cookies", "models", "2026-02-28", "https_gen.pollinations.ai_text_models.json"),
  Re(Ir, "g4f-data", "har_and_cookies", "models", "2026-02-28", "https_g4f.space_api_pollinations_models.json")
];
function Ar(e) {
  try {
    return ys(e) ? JSON.parse(gs(e, "utf8")) : null;
  } catch {
    return null;
  }
}
function xe(e) {
  return e === !0 || e === 1 || e === "1";
}
function Dr(e) {
  return Array.from(new Set(e.map((t) => String(t || "").trim()).filter(Boolean)));
}
function Af() {
  for (const e of Nf) {
    const t = Ar(e);
    if (t && (Array.isArray(t.image_models) || Array.isArray(t.video_models) || t.audio_models))
      return t;
  }
  return null;
}
async function Si() {
  try {
    const t = await (await fetch(`${Ge}/v1/models`, { signal: AbortSignal.timeout(1e4) })).json();
    return Array.isArray(t?.data) ? t.data : Array.isArray(t) ? t : [];
  } catch {
    return [];
  }
}
function nc() {
  const e = Af();
  if (!e) return [];
  const t = Dr([
    ...e.image_models ?? [],
    "flux",
    "flux-klein",
    "flux-klein-9b",
    "kontext",
    "seedream",
    "seedream-pro",
    "nanobanana",
    "nanobanana-pro",
    "imagen",
    "gpt-image",
    "gpt-image-1.5"
  ]), r = Dr([
    ...e.video_models ?? [],
    "veo-3.1-fast",
    "seedance",
    "seedance-pro",
    "wan2.6",
    "ltx2",
    "grok-imagine-video"
  ]), n = e.audio_models && typeof e.audio_models == "object" ? Object.keys(e.audio_models) : [], a = /* @__PURE__ */ new Map();
  for (const s of t)
    a.set(s, { name: s, image: !0, video: !1, audio: !1, vision: !1, providers: ["ApiAirforce", "Yqcloud"] });
  for (const s of r) {
    const o = a.get(s);
    o ? o.video = !0 : a.set(s, { name: s, image: !1, video: !0, audio: !1, vision: !1, providers: ["ApiAirforce", "Yqcloud"] });
  }
  for (const s of n) {
    const o = a.get(s);
    o ? o.audio = !0 : a.set(s, { name: s, image: !1, video: !1, audio: !0, vision: !1, providers: ["ApiAirforce", "Yqcloud"] });
  }
  return Array.from(a.values());
}
function jf(e) {
  return e.filter((t) => !xe(t.provider)).map((t) => ({
    name: t.name ?? t.id ?? "sin-modelo",
    image: xe(t.image),
    video: xe(t.video),
    audio: xe(t.audio),
    vision: xe(t.vision),
    providers: []
  }));
}
function _t(e) {
  return e === "ApiAirforce" || e === "Yqcloud";
}
function Or(e) {
  return e === "PollinationsAI" || e === "PollinationsImage";
}
function it(e) {
  return e === "G4F Auto";
}
function kf(e) {
  const t = e.filter((a) => xe(a.provider)), r = nc(), n = t.map((a) => {
    const s = a.id ?? a.name ?? "unknown", o = _t(s), i = Or(s), l = o ? r.filter((y) => y.image).length : Number(xe(a.image)), u = o ? r.filter((y) => y.video).length : 0, c = o ? r.filter((y) => y.audio).length : 0;
    return {
      name: s,
      label: a.owned_by || s,
      live: !i,
      image: l,
      video: u,
      audio: c,
      vision: xe(a.vision) || o
    };
  });
  return n.push({
    name: "G4F Auto",
    label: "G4F Auto",
    live: !0,
    image: r.filter((a) => a.image).length,
    video: r.filter((a) => a.video).length,
    audio: r.filter((a) => a.audio).length,
    vision: !0
  }), n.sort((a, s) => it(a.name) !== it(s.name) ? it(a.name) ? -1 : 1 : _t(a.name) !== _t(s.name) ? _t(a.name) ? -1 : 1 : Or(a.name) !== Or(s.name) ? Or(a.name) ? 1 : -1 : a.label.localeCompare(s.label));
}
function Cf(e, t) {
  const r = jf(t).filter((s) => !s.image && !s.video && !s.audio), n = nc(), a = /* @__PURE__ */ new Map();
  for (const s of r)
    a.set(s.name, { ...s, providers: [] });
  if (_t(e) || it(e))
    for (const s of n) {
      const o = a.get(s.name);
      if (!o) {
        a.set(s.name, {
          ...s,
          providers: it(e) ? ["G4F Auto", ...s.providers ?? []] : [...s.providers ?? []]
        });
        continue;
      }
      o.image = o.image || s.image, o.video = o.video || s.video, o.audio = o.audio || s.audio, o.vision = o.vision || s.vision, o.providers = Dr([
        ...o.providers ?? [],
        ...it(e) ? ["G4F Auto"] : [],
        ...s.providers ?? []
      ]);
    }
  return Array.from(a.values()).sort((s, o) => s.name.localeCompare(o.name));
}
function qf(e) {
  return new Promise((t) => setTimeout(t, e));
}
function sc(e, t = "media") {
  return String(e || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || t;
}
function Lr(e, t) {
  return String(e || "").match(/\.([a-z0-9]{2,5})(?:[?#].*)?$/i)?.[1]?.toLowerCase() || t;
}
function Et(e, t, r) {
  const n = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
  return `${e}-${sc(t, "auto")}-${n}.${r}`;
}
async function Mr(e, t, r) {
  const n = await fetch(e, { ...t, signal: AbortSignal.timeout(r) }), a = await n.text();
  let s = null;
  try {
    s = a ? JSON.parse(a) : null;
  } catch {
    s = null;
  }
  return { ok: n.ok, status: n.status, data: s, text: a };
}
async function Ur(e, t, r) {
  vs(t, { recursive: !0 });
  const n = await fetch(e, { signal: AbortSignal.timeout(3e5) });
  if (!n.ok) throw new Error(`Download failed with HTTP ${n.status}`);
  const a = Buffer.from(await n.arrayBuffer()), s = De(t, r);
  return _s(s, a), s;
}
function ac(e) {
  const t = String(e || "").trim(), r = /* @__PURE__ */ new Set(), n = [], a = (s) => {
    const o = s || "__auto__";
    r.has(o) || (r.add(o), n.push(s));
  };
  return t && t.toLowerCase() !== "auto" && a(t), a(null), t === "ApiAirforce" && a("Yqcloud"), t === "Yqcloud" && a("ApiAirforce"), n;
}
function Df(e, t) {
  const r = sc(t, ""), a = Dr([
    r === "nanobanana" || r === "seedream" || r === "flux-pro" ? t : null,
    "nanobanana",
    "seedream",
    "flux-pro"
  ])[0] || "nanobanana";
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(e)}?model=${encodeURIComponent(a)}&width=1024&height=1024&nologo=true`;
}
async function Lf(e) {
  const t = String(e.prompt || e.description || "").trim();
  if (!t) return { success: !1, error: "Missing prompt" };
  const r = String(e.targetDir || Cs), n = String(e.model || "flux"), a = ac(e.provider), s = [];
  for (const o of a)
    try {
      const i = { prompt: t, model: n, response_format: "url" };
      o && (i.provider = o);
      const l = await Mr(`${Ge}/v1/images/generations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(i)
      }, 18e4);
      if (!l.ok) {
        s.push(`${o || "auto"}:${l.data?.error?.message || l.text || l.status}`);
        continue;
      }
      const u = l.data?.data?.[0]?.url || l.data?.url;
      if (!u) {
        s.push(`${o || "auto"}:media-without-url`);
        continue;
      }
      const c = Et("image", n, Lr(u, "webp")), y = await Ur(u, r, c);
      return {
        success: !0,
        kind: "image",
        prompt: t,
        provider: l.data?.provider || o || "auto",
        model: l.data?.model || n,
        url: u,
        savedPath: y,
        filename: c
      };
    } catch (i) {
      s.push(`${o || "auto"}:${i.message}`);
    }
  try {
    const o = Df(t, n), i = Et("image", n || "nanobanana", Lr(o, "png")), l = await Ur(o, r, i);
    return {
      success: !0,
      kind: "image",
      prompt: t,
      provider: "PollinationsAI",
      model: n || "nanobanana",
      url: o,
      savedPath: l,
      filename: i,
      degraded: !0,
      note: s.join(" | ")
    };
  } catch (o) {
    s.push(`reserve:${o.message}`);
  }
  return { success: !1, error: `G4F image pipeline failed: ${s.join(" | ") || "no-response"}` };
}
async function Mf(e, t, r = 3e5) {
  const n = Date.now() + r;
  for (; Date.now() < n; ) {
    const a = await Mr(`${Ke}/api/media/jobs/${e}`, {
      headers: { Authorization: `Bearer ${t}` }
    }, 15e3);
    if (a.ok && a.data) {
      const s = String(a.data.status || "");
      if (s === "completed" || s === "failed") return a.data;
    }
    await qf(3e3);
  }
  throw new Error(`Timeout waiting for media job ${e}`);
}
async function Uf(e) {
  const t = String(e.prompt || e.description || "").trim();
  if (!t) return { success: !1, error: "Missing prompt" };
  const r = ie("openclaw") || Yr, n = String(e.targetDir || Cs), a = String(e.model || "veo-3.1-fast"), s = ac(e.provider), o = [];
  for (const i of s)
    try {
      const l = { prompt: t, model: a, response_format: "url" };
      i && (l.provider = i);
      const u = await Mr(`${Ge}/v1/media/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(l)
      }, 3e5);
      if (!u.ok) {
        o.push(`${i || "auto"}:${u.data?.error?.message || u.text || u.status}`);
        continue;
      }
      const c = u.data?.data?.[0]?.url || u.data?.video?.url || u.data?.url;
      if (!c) {
        o.push(`${i || "auto"}:media-without-url`);
        continue;
      }
      const y = Et("video", a, Lr(c, "mp4")), f = await Ur(c, n, y);
      return {
        success: !0,
        kind: "video",
        prompt: t,
        provider: u.data?.provider || i || "auto",
        model: u.data?.model || a,
        url: c,
        savedPath: f,
        filename: y
      };
    } catch (l) {
      o.push(`${i || "auto"}:${l.message}`);
    }
  try {
    const i = await Mr(`${Ke}/api/media/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${r}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        kind: "video",
        prompt: t,
        model: a,
        provider: e.provider || void 0,
        duration: e.duration || 5,
        dryRun: !1
      })
    }, 3e5);
    if (i.ok && i.data?.job) {
      const l = i.data.job?.status === "completed" ? i.data.job : await Mf(i.data.job.id, r), u = l?.resultUrl;
      if (u) {
        const c = Et("video", a, Lr(u, "mp4")), y = await Ur(u, n, c);
        return {
          success: !0,
          kind: "video",
          prompt: t,
          provider: l.provider || e.provider || "opencloud",
          model: a,
          url: u,
          savedPath: y,
          filename: c,
          degraded: !0
        };
      }
      o.push(`opencloud:${l?.error || "job-without-url"}`);
    } else
      o.push(`opencloud:${i.data?.error || i.text || i.status}`);
  } catch (i) {
    o.push(`opencloud:${i.message}`);
  }
  return { success: !1, error: `G4F video pipeline failed: ${o.join(" | ") || "no-response"}` };
}
async function Ff(e) {
  const t = String(e.text || e.input || e.prompt || "").trim();
  if (!t) return { success: !1, error: "Missing text" };
  const r = ie("deepgram");
  if (!r) return { success: !1, error: "Deepgram key not configured" };
  const n = String(e.voice || "aura-2-carina-es"), a = String(e.targetDir || Cs);
  try {
    const s = await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(n)}&encoding=mp3`, {
      method: "POST",
      headers: {
        Authorization: `Token ${r}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: t }),
      signal: AbortSignal.timeout(3e4)
    });
    if (!s.ok) return { success: !1, error: `Deepgram TTS failed with HTTP ${s.status}` };
    vs(a, { recursive: !0 });
    const o = Et("audio", n, "mp3"), i = De(a, o);
    return _s(i, Buffer.from(await s.arrayBuffer())), {
      success: !0,
      kind: "audio",
      voice: n,
      text: t,
      savedPath: i,
      filename: o,
      provider: "Deepgram",
      model: n
    };
  } catch (s) {
    return { success: !1, error: `Deepgram TTS error: ${s.message}` };
  }
}
async function oc(e, t) {
  const r = ie("openclaw") || Yr, n = Tf++;
  try {
    const a = await fetch(`${Ke}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${r}`
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: n, method: e, params: t }),
      signal: AbortSignal.timeout(5e3)
    });
    return a.ok ? (await a.json()).result ?? null : null;
  } catch {
    return null;
  }
}
async function qe(e, t = "/health") {
  try {
    return (await fetch(`${e}${t}`, {
      signal: AbortSignal.timeout(2e3)
    })).ok;
  } catch {
    try {
      return (await fetch(e, { signal: AbortSignal.timeout(2e3) })).status < 500;
    } catch {
      return !1;
    }
  }
}
async function Vf() {
  const e = await oc("tools/list");
  if (e?.tools?.length > 0) return e.tools;
  try {
    const t = ie("openclaw") || Yr, r = await fetch(`${Ke}/api/mcp/tools`, {
      headers: { Authorization: `Bearer ${t}` },
      signal: AbortSignal.timeout(3e3)
    });
    if (r.ok) {
      const n = await r.json();
      if (n.tools?.length > 0) return n.tools;
    }
  } catch {
  }
  return Gf;
}
async function zf(e, t) {
  if (e === "generate_image")
    return Lf(t);
  if (e === "generate_video")
    return Uf(t);
  if (e === "generate_audio")
    return Ff(t);
  const r = await oc("tools/call", { name: e, arguments: t });
  if (r) return r?.result ?? r?.structuredContent ?? r;
  try {
    const n = ie("openclaw") || Yr, a = await fetch(`${Ke}/api/mcp/execute`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${n}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ tool: e, arguments: t }),
      signal: AbortSignal.timeout(3e4)
    });
    if (a.ok) {
      const o = await a.json();
      return o.result || o;
    }
    const s = await a.text();
    return { error: `${a.status}: ${s}` };
  } catch (n) {
    return { error: n.message };
  }
}
const Gf = [
  // Archivos
  { name: "read_file", description: "Leer contenido de un archivo", inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
  { name: "write_file", description: "Crear o sobrescribir un archivo", inputSchema: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } },
  { name: "list_files", description: "Listar archivos de un directorio", inputSchema: { type: "object", properties: { path: { type: "string" }, filter: { type: "string" } }, required: ["path"] } },
  { name: "search_files", description: "Buscar en archivos con regex", inputSchema: { type: "object", properties: { pattern: { type: "string" }, path: { type: "string" } }, required: ["pattern"] } },
  { name: "delete_file", description: "Eliminar archivo o directorio", inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
  // Memoria
  { name: "memory_store", description: "Guardar dato en memoria persistente", inputSchema: { type: "object", properties: { key: { type: "string" }, value: { type: "string" }, category: { type: "string" } }, required: ["key", "value"] } },
  { name: "memory_get", description: "Recuperar dato de memoria por clave", inputSchema: { type: "object", properties: { key: { type: "string" } }, required: ["key"] } },
  { name: "memory_search", description: "Buscar en memoria por texto", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  // Obsidian
  { name: "vault_daily_append", description: "Añadir texto al diario de Obsidian de hoy", inputSchema: { type: "object", properties: { content: { type: "string" } }, required: ["content"] } },
  { name: "vault_read", description: "Leer nota del vault de Obsidian", inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
  { name: "vault_write", description: "Escribir nota en el vault de Obsidian", inputSchema: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } },
  { name: "vault_search", description: "Buscar en el vault de Obsidian", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  // Agentes
  { name: "list_agents", description: "Listar los 175 agentes especializados disponibles", inputSchema: { type: "object", properties: {} } },
  { name: "start_agent", description: "Iniciar un agente especializado", inputSchema: { type: "object", properties: { agentId: { type: "string" }, task: { type: "string" } }, required: ["agentId"] } },
  { name: "stop_agent", description: "Detener un agente en ejecución", inputSchema: { type: "object", properties: { agentId: { type: "string" } }, required: ["agentId"] } },
  { name: "send_task_to_agent", description: "Delegar tarea a agente específico", inputSchema: { type: "object", properties: { agentId: { type: "string" }, task: { type: "string" } }, required: ["agentId", "task"] } },
  { name: "get_agent_status", description: "Ver estado de un agente", inputSchema: { type: "object", properties: { agentId: { type: "string" } }, required: ["agentId"] } },
  { name: "create_agent", description: "Crear nuevo agente dinámico", inputSchema: { type: "object", properties: { name: { type: "string" }, instructions: { type: "string" } }, required: ["name", "instructions"] } },
  // Aider / Stack de desarrollo
  { name: "open_aider_terminal", description: "Abrir terminal de Aider para programación en pareja con IA", inputSchema: { type: "object", properties: { path: { type: "string" } } } },
  { name: "open_aider_manus_stack", description: "Abrir stack completo Aider + OpenManus", inputSchema: { type: "object", properties: { task: { type: "string" } } } },
  { name: "plan_5_phases_and_open_stack", description: "Planificación estratégica en 5 fases y apertura del stack", inputSchema: { type: "object", properties: { objective: { type: "string" } }, required: ["objective"] } },
  // Generación multimedia
  { name: "generate_image", description: "Generar imagen desde texto (G4F)", inputSchema: { type: "object", properties: { prompt: { type: "string" }, size: { type: "string" } }, required: ["prompt"] } },
  { name: "generate_video", description: "Generar vídeo desde texto", inputSchema: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] } },
  { name: "generate_avatar", description: "Generar avatar personalizado", inputSchema: { type: "object", properties: { description: { type: "string" } }, required: ["description"] } },
  { name: "generate_audio", description: "Síntesis de voz (TTS)", inputSchema: { type: "object", properties: { text: { type: "string" }, voice: { type: "string" } }, required: ["text"] } },
  // Web e información
  { name: "web_search", description: "Buscar en internet en tiempo real", inputSchema: { type: "object", properties: { query: { type: "string" }, maxResults: { type: "number" } }, required: ["query"] } },
  { name: "fetch_url", description: "Obtener contenido de URL o API REST pública", inputSchema: { type: "object", properties: { url: { type: "string" }, method: { type: "string" }, headers: { type: "object" }, body: { type: "string" } }, required: ["url"] } },
  // GuestsValencia — Negocio
  { name: "analyze_revenue", description: "Analizar ingresos de GuestsValencia", inputSchema: { type: "object", properties: { period: { type: "string" } } } },
  { name: "optimize_pricing", description: "Optimizar precios de alojamientos", inputSchema: { type: "object", properties: { propertyId: { type: "string" } } } },
  { name: "check_bookings", description: "Ver reservas actuales de GuestsValencia", inputSchema: { type: "object", properties: { dateFrom: { type: "string" }, dateTo: { type: "string" } } } },
  { name: "create_report", description: "Generar informe de negocio", inputSchema: { type: "object", properties: { type: { type: "string" }, period: { type: "string" } }, required: ["type"] } },
  // Desarrollo
  { name: "git_status", description: "Estado del repositorio Git", inputSchema: { type: "object", properties: { path: { type: "string" } } } },
  { name: "git_commit", description: "Hacer commit en repositorio Git", inputSchema: { type: "object", properties: { message: { type: "string" }, path: { type: "string" } }, required: ["message"] } },
  { name: "npm_run", description: "Ejecutar script NPM", inputSchema: { type: "object", properties: { script: { type: "string" }, cwd: { type: "string" } }, required: ["script"] } },
  { name: "analyze_code", description: "Analizar calidad y estructura del código", inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
  { name: "check_system_health", description: "Diagnóstico del sistema SOFÍA", inputSchema: { type: "object", properties: {} } },
  // Ejecución
  { name: "execute_code", description: "Ejecutar código Python, Bash o PowerShell", inputSchema: { type: "object", properties: { language: { type: "string", enum: ["python", "bash", "powershell", "javascript"] }, code: { type: "string" } }, required: ["language", "code"] } },
  { name: "execute_command", description: "Ejecutar comando de sistema/shell", inputSchema: { type: "object", properties: { command: { type: "string" }, cwd: { type: "string" } }, required: ["command"] } },
  // Computer Use (control del equipo)
  { name: "capture_screen", description: "Capturar screenshot de la pantalla actual", inputSchema: { type: "object", properties: { region: { type: "object" } } } },
  { name: "execute_desktop", description: "Controlar ratón y teclado del equipo (Computer Use)", inputSchema: { type: "object", properties: { action: { type: "string", enum: ["click", "move", "type", "key", "scroll", "drag"] }, x: { type: "number" }, y: { type: "number" }, text: { type: "string" }, key: { type: "string" } }, required: ["action"] } },
  // Comunicación
  { name: "manage_email", description: "Gestionar emails (leer, enviar, responder)", inputSchema: { type: "object", properties: { action: { type: "string" }, to: { type: "string" }, subject: { type: "string" }, body: { type: "string" } }, required: ["action"] } },
  // Estado del sistema
  { name: "create_snapshot", description: "Crear snapshot del estado actual de la aplicación", inputSchema: { type: "object", properties: { name: { type: "string" } } } },
  { name: "restore_snapshot", description: "Restaurar estado desde snapshot", inputSchema: { type: "object", properties: { snapshotId: { type: "string" } }, required: ["snapshotId"] } },
  { name: "get_metrics", description: "Métricas de uso y rendimiento del sistema", inputSchema: { type: "object", properties: { period: { type: "string" } } } },
  // Proveedores
  { name: "check_providers", description: "Verificar estado de todos los proveedores de IA", inputSchema: { type: "object", properties: {} } },
  // Base de datos
  { name: "neon_query", description: "Consulta SQL directa a la base de datos Neon PostgreSQL", inputSchema: { type: "object", properties: { query: { type: "string" }, params: { type: "array" } }, required: ["query"] } },
  // Automatización de negocio
  { name: "generate_monetization_script", description: "Generar script de automatización de ingresos", inputSchema: { type: "object", properties: { type: { type: "string" } } } },
  { name: "create_content_calendar", description: "Crear calendario de contenidos", inputSchema: { type: "object", properties: { period: { type: "string" }, channels: { type: "array" } } } }
];
function xf(e) {
  e.handle("mcp:get-servers", async () => {
    const [t, r, n, a, s, o] = await Promise.allSettled([
      qe(Ke, "/api/status"),
      qe($i),
      qe(Ei),
      qe(Ge, "/v1/models"),
      qe(wi, "/health"),
      qe(us)
    ]), i = (l) => l.status === "fulfilled" && l.value ? "connected" : "disconnected";
    return {
      servers: [
        { id: "openclaw-legacy", name: "OpenCloud Gateway (51 tools)", url: Ke, status: i(t), type: "mcp" },
        { id: "pwa-bridge", name: "PWA Bridge (50+ servicios)", url: $i, status: i(r), type: "bridge" },
        { id: "subagents", name: "Subagents Runtime (175 agentes)", url: Ei, status: i(n), type: "agents" },
        { id: "g4f", name: "G4F Docker (793 modelos)", url: Ge, status: i(a), type: "llm" },
        { id: "openclaw-official", name: "OpenClaw Oficial", url: wi, status: i(s), type: "gateway" },
        { id: "proactor", name: "Proactor Inteligente", url: us, status: i(o), type: "proactor" }
      ]
    };
  }), e.handle("mcp:get-tools", async () => {
    const t = await Vf();
    return { tools: t, count: t.length };
  }), e.handle("mcp:get-editor-inventory", async () => {
    const t = Ar(ls);
    return t ? { ok: !0, path: ls, ...t } : {
      ok: !1,
      path: ls,
      summary: {
        configsFound: 0,
        configsScanned: 0,
        totalServers: 0,
        context7Detected: []
      },
      configs: [],
      servers: []
    };
  }), e.handle("mcp:get-openclaw-library", async () => {
    const t = Ar(ds);
    return t ? { ok: !0, path: ds, ...t } : {
      ok: !1,
      path: ds,
      generatedAt: null,
      notes: [],
      inventory: null,
      sources: {}
    };
  }), e.handle("mcp:get-memory-policy", async () => {
    const t = Ar(fs);
    return t ? { ok: !0, path: fs, ...t } : {
      ok: !1,
      path: fs,
      generatedAt: null,
      state: "missing",
      lanes: [],
      forbiddenSharing: [],
      adapters: []
    };
  }), e.handle("mcp:call-tool", async (t, r, n) => zf(r, n)), e.handle("mcp:connect", async (t, r) => (console.log("[MCP] Connect request:", r), !0)), e.handle("mcp:disconnect", async (t, r) => (console.log("[MCP] Disconnect request:", r), !0)), e.handle("mcp:check-health", async () => {
    const [t, r, n] = await Promise.allSettled([
      qe(Ke, "/api/status"),
      qe(Ge, "/v1/models"),
      qe(us)
    ]);
    return {
      gateway: t.status === "fulfilled" && t.value,
      g4f: r.status === "fulfilled" && r.value,
      proactor: n.status === "fulfilled" && n.value,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }), e.handle("g4f:list-providers", async () => {
    try {
      const t = await Si();
      return { providers: kf(t) };
    } catch {
      return { providers: [] };
    }
  }), e.handle("g4f:list-provider-models", async (t, r) => {
    try {
      const n = await Si();
      return { models: Cf(r, n) };
    } catch {
      return { models: [] };
    }
  }), e.handle("g4f:test-providers", async () => {
    const t = [
      { provider: "ApiAirforce", model: "gpt-4o" },
      { provider: "Yqcloud", model: "gpt-4o" },
      { provider: "OperaAria", model: "gpt-4o" },
      { provider: "Perplexity", model: "gpt-4o" },
      { provider: "Cerebras", model: "llama-3.3-70b" },
      { provider: "DeepInfra", model: "meta-llama/Meta-Llama-3.1-70B-Instruct" },
      { provider: "PollinationsAI", model: "openai" },
      { provider: "PollinationsAI", model: "openai-fast" }
    ], r = [];
    for (const { provider: n, model: a } of t) {
      const s = Date.now();
      try {
        const o = await fetch(`${Ge}/v1/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: a,
            provider: n,
            messages: [{ role: "user", content: "Hi" }],
            max_tokens: 10,
            stream: !1
          }),
          signal: AbortSignal.timeout(15e3)
        });
        let i = "";
        try {
          i = (await o.json())?.choices?.[0]?.message?.content?.slice(0, 60) ?? "";
        } catch {
        }
        r.push({ provider: n, model: a, status: o.status, ok: o.ok, latencyMs: Date.now() - s, response: i });
      } catch (o) {
        r.push({ provider: n, model: a, status: 0, ok: !1, error: o.message, latencyMs: Date.now() - s });
      }
    }
    return r;
  }), e.handle("g4f:list-models", async () => {
    try {
      const r = await (await fetch(`${Ge}/v1/models`, { signal: AbortSignal.timeout(1e4) })).json();
      return { models: r.data ?? r ?? [] };
    } catch {
      return { models: [] };
    }
  });
}
const Kf = lc(import.meta.url), ps = fc(Kf);
let oe = null;
ct.whenReady().then(() => {
  gc.defaultSession.setPermissionRequestHandler((e, t, r) => {
    r(t === "media" || t === "mediaKeySystem");
  }), ic();
});
ct.on("window-all-closed", () => {
  ct.quit();
});
ct.on("activate", () => {
  Ri.getAllWindows().length === 0 && ic();
});
function ic() {
  ct.commandLine.appendSwitch("disk-cache-dir", De(ct.getPath("temp"), `sofia-gpu-${process.pid}`)), oe = new Ri({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: !0,
    webPreferences: {
      preload: De(ps, "preload.mjs"),
      contextIsolation: !0,
      nodeIntegration: !1,
      sandbox: !1
    },
    backgroundColor: "#0b0d10",
    show: !1,
    icon: De(ps, "../resources/icon.ico")
  });
  let e = !1;
  const t = () => {
    e || (e = !0, oe?.show());
  };
  oe.once("ready-to-show", t), setTimeout(t, 1500), process.env.VITE_DEV_SERVER_URL ? oe.loadURL(process.env.VITE_DEV_SERVER_URL) : oe.loadFile(De(ps, "../dist/index.html")), Se.handle("window:minimize", () => oe?.minimize()), Se.handle("window:maximize", () => {
    oe?.isMaximized() ? oe.unmaximize() : oe?.maximize();
  }), Se.handle("window:close", () => oe?.close()), Se.handle("window:isMaximized", () => oe?.isMaximized() ?? !1), Se.handle("desktop:open-path", async (r, n) => {
    const a = await Ls.openPath(n);
    return { ok: a === "", error: a };
  }), Se.handle("desktop:open-external", async (r, n) => (await Ls.openExternal(n), { ok: !0 })), oe.on("maximize", () => oe?.webContents.send("window:maximized-changed", !0)), oe.on("unmaximize", () => oe?.webContents.send("window:maximized-changed", !1)), ff(Se), gf(Se, oe), If(Se, oe), Of(Se), xf(Se), oe.on("closed", () => {
    oe = null;
  });
}
