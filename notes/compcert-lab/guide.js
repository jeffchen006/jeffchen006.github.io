import { examples } from "./examples.js";

export const upstream = "https://github.com/AbsInt/CompCert/blob/v3.18/";
const chooseFlags = "-O1 -fno-if-conversion";
export const traceCommand =
  `ccomp ${chooseFlags} -S -dc -dclight -dcminor -drtl -dmach choose.c`;

// Excerpts for choose_group, captured from the v3.18 tag on aarch64-macos.
export const stages = {
  c: {
    title: "C source",
    file: "cfrontend/Csyntax.v",
    info: "The driver preprocesses C and elaborates it into CompCert C. The verified pipeline starts from that internal AST. This example assigns group on each branch before testing it again.",
    caption: "choose.c · input",
    code: examples.branch.source.trimEnd(),
  },
  clight: {
    title: "Clight",
    file: "cfrontend/Clight.v",
    info: "SimplExpr pulls side effects out of expressions and chooses an evaluation order. Clight keeps C types and structured statements, so both conditionals are still visible.",
    caption: "choose.light.c · excerpt",
    code: `unsigned int choose_group(unsigned int n)
{
  unsigned int group;
  if (n < 8U) {
    group = 1U;
  } else {
    group = 2U;
  }
  if (group == 1U) {
    return 7U;
  }
  return 12U;
}`,
  },
  cminor: {
    title: "Cminor",
    file: "backend/Cminor.v",
    info: "Cminor uses low-level operations, structured control flow and explicit memory accesses. The comparison <u records that n is unsigned.",
    caption: "choose.cm · excerpt",
    code: `"choose_group"(n) : int -> int
{
  var group;
  if (n <u 8) {
    group = 1;
  } else {
    group = 2;
  }
  if (group ==u 1) {
    return 7;
  }
  return 12;
}`,
  },
  rtl: {
    title: "Register transfer language",
    file: "backend/RTL.v",
    info: "RTL represents a function as a control-flow graph over pseudo-registers. After Constprop, nodes 5 and 6 can jump directly to 3 and 2. Each incoming edge already fixes the value tested at node 4.",
  },
  mach: {
    title: "Mach",
    file: "backend/Mach.v",
    info: "By this stage, the compiler has assigned physical registers and computed the stack frame layout. The second conditional is gone and both results are written to X0, the return register.",
    caption: "choose.mach · excerpt",
    code: `choose_group() {
	if (X0 <u 8) goto 2
	X0 = 12
	goto 1
    2:	X0 = 7
    1:	return
}`,
  },
  asm: {
    title: "Assembly",
    file: "aarch64/Asm.v",
    info: "The driver prints assembly text from CompCert’s assembly model. On this AArch64 build, cmp and b.lo implement the remaining unsigned comparison against 8.",
    caption: "choose.s · excerpt",
    code: `_choose_group:
	.cfi_startproc
	mov	x15, sp
	stp	x15, x30, [sp, #-16]!
	.cfi_adjust_cfa_offset	16
	.cfi_rel_offset	x30, 8
	cmp	w0, #8
	b.lo	L100
	orr	w0, wzr, #12
	b	L101
L100:
	orr	w0, wzr, #7
L101:
	ldr	x30, [sp, #8]
	add	sp, sp, #16
	ret	x30
	.cfi_endproc`,
  },
};

export const rtl = {
  before: `choose_group(x1) {
    7:	if (x1 <u 8) goto 5 else goto 6
    6:	x2 = 2
	goto 4
    5:	x2 = 1
    4:	if (x2 ==u 1) goto 3 else goto 2
    3:	x3 = 7
	goto 1
    2:	x3 = 12
    1:	return x3
}`,
  after: `choose_group(x1) {
    7:	if (x1 <u 8) goto 5 else goto 6
    6:	x2 = 2
	goto 2
    5:	x2 = 1
	goto 3
    4:	if (x2 ==u 1) goto 3 else goto 2
    3:	x3 = 7
	goto 1
    2:	x3 = 12
    1:	return x3
}`,
};

export const development = {
  build: {
    title: "Build from the release tag",
    info: "Install GNU Make, a native C toolchain, OCaml, Menhir, and a compatible Rocq or Coq version. Configure for your machine. The build checks the proofs, extracts OCaml, and produces ./ccomp. This release tag reports 3.17 in its version banner.",
    link: "https://compcert.org/man/manual002.html",
    linkText: "Prerequisites and installation",
    caption: "Terminal · source checkout",
    code: target => `git clone --branch v3.18 https://github.com/AbsInt/CompCert.git
cd CompCert
./configure ${target}
make -j4
./ccomp -help`,
  },
  trace: {
    title: "Capture RTL before and after Constprop",
    info: "Save choose.c in the checkout. Disable if-conversion to keep the first conditional as a branch. The driver saves .rtl.3 before constant propagation and .rtl.4 immediately after it.",
    link: upstream + "driver/Compiler.v#L112-L129",
    linkText: "See where the dumps are written",
    caption: "Terminal · before editing",
    code: () => `./ccomp ${chooseFlags} -S -drtl choose.c &&
cp choose.rtl.4 baseline.rtl &&
diff -u choose.rtl.3 baseline.rtl
`,
  },
  modify: {
    title: "Set the lookahead budget to zero",
    info: "In backend/Constprop.v, change num_iter from 10 to 0 to disable successor lookahead. match_successor_rec proves the lookahead correct for an arbitrary budget. Try both settings in the model below.",
    link: upstream + "backend/Constpropproof.v#L152-L177",
    linkText: "Read the generalized lemma",
    caption: "backend/Constprop.v · edit",
    code: () => `- Definition num_iter := 10%nat.
+ Definition num_iter := 0%nat.`,
  },
  validate: {
    title: "Rebuild, run, and compare",
    info: "Rebuild the proofs and the extracted compiler. The two calls in main check both branch outcomes. In the Apple silicon build, nodes 5 and 6 now lead back through conditional node 4, so the diff shows the lost shortcuts.",
    link: upstream + "backend/Constpropproof.v#L607-L626",
    linkText: "Open the pass correctness theorem",
    caption: "Terminal · after editing",
    code: () => `make -j4 &&
./ccomp -stdlib ./runtime ${chooseFlags} -drtl -o choose-after choose.c &&
./choose-after &&
echo "Both branch outcomes passed" &&
diff -u baseline.rtl choose.rtl.4`,
  },
};
