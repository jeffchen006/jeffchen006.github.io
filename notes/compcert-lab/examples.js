export const examples = {
  constant: {
    filename: "affine.c",
    note: "Look for how the multiplier 8 and offset 20 are encoded in each build. The test in main checks that affine(3) returns 44.",
    source: `unsigned affine(unsigned x) {
    unsigned scale = 8u;
    unsigned offset = 20u;
    return x * scale + offset;
}

int main(void) {
    return affine(3u) != 44u;
}
`,
  },
  loop: {
    filename: "sum.c",
    note: "Find the backward branch in sum_to. The additions use unsigned arithmetic and wrap modulo 2³² on this target.",
    source: `unsigned sum_to(unsigned n) {
    unsigned sum = 0;
    for (unsigned i = 0; i < n; ++i)
        sum += i;
    return sum;
}

int main(void) {
    return sum_to(10u) != 45u;
}
`,
  },
  branch: {
    filename: "choose.c",
    note: "Compare the first comparison at -O0 and -O1. The optimized x86-64 build uses a conditional move to select the value of group.",
    source: `unsigned choose_group(unsigned n) {
    unsigned group;
    if (n < 8u)
        group = 1u;
    else
        group = 2u;

    if (group == 1u)
        return 7u;
    return 12u;
}

int main(void) {
    return choose_group(0u) != 7u || choose_group(8u) != 12u;
}
`,
  },
};
