// Recorded CompCert 3.18 x86-64 Linux assembly from Compiler Explorer.
const summation = `sum_to:
        subq    $8, %rsp
        leaq    16(%rsp), %rax
        movq    %rax, 0(%rsp)
        xorl    %eax, %eax
        xorl    %ecx, %ecx
.L105:
        cmpl    %edi, %ecx
        jae     .L106
        leal    0(%eax,%ecx,1), %eax
        leal    1(%ecx), %ecx
        jmp     .L105
.L106:
        addq    $8, %rsp
        ret
main:
        subq    $8, %rsp
        leaq    16(%rsp), %rax
        movq    %rax, 0(%rsp)
        movl    $10, %edi
        call    sum_to
        cmpl    $45, %eax
        setne   %al
        movzbl  %al, %eax
        addq    $8, %rsp
        ret`;

export const recordedAssembly = {
  constant: {
    "-O0": `affine:
        subq    $8, %rsp
        leaq    16(%rsp), %rax
        movq    %rax, 0(%rsp)
        movl    $8, %eax
        movl    $20, %ecx
        imull   %eax, %edi
        leal    0(%edi,%ecx,1), %eax
        addq    $8, %rsp
        ret
main:
        subq    $8, %rsp
        leaq    16(%rsp), %rax
        movq    %rax, 0(%rsp)
        movl    $3, %edi
        call    affine
        cmpl    $44, %eax
        setne   %al
        movzbl  %al, %eax
        addq    $8, %rsp
        ret`,
    "-O1": `affine:
        subq    $8, %rsp
        leaq    16(%rsp), %rax
        movq    %rax, 0(%rsp)
        sall    $3, %edi
        leal    20(%edi), %eax
        addq    $8, %rsp
        ret
main:
        subq    $8, %rsp
        leaq    16(%rsp), %rax
        movq    %rax, 0(%rsp)
        movl    $3, %edi
        call    affine
        cmpl    $44, %eax
        setne   %al
        movzbl  %al, %eax
        addq    $8, %rsp
        ret`,
  },
  loop: {
    "-O0": summation,
    "-O1": summation,
  },
  branch: {
    "-O0": `choose_group:
        subq    $8, %rsp
        leaq    16(%rsp), %rax
        movq    %rax, 0(%rsp)
        cmpl    $8, %edi
        jb      .L103
        movl    $2, %eax
        jmp     .L106
.L103:
        movl    $1, %eax
.L106:
        cmpl    $1, %eax
        jne     .L108
        movl    $7, %eax
        jmp     .L111
.L108:
        movl    $12, %eax
.L111:
        addq    $8, %rsp
        ret
main:
        subq    $8, %rsp
        leaq    16(%rsp), %rax
        movq    %rax, 0(%rsp)
        xorl    %edi, %edi
        call    choose_group
        cmpl    $7, %eax
        jne     .L117
        movl    $8, %edi
        call    choose_group
        cmpl    $12, %eax
        setne   %al
        movzbl  %al, %eax
        jmp     .L118
.L117:
        movl    $1, %eax
.L118:
        addq    $8, %rsp
        ret`,
    "-O1": `choose_group:
        subq    $8, %rsp
        leaq    16(%rsp), %rax
        movq    %rax, 0(%rsp)
        movl    $1, %eax
        movl    $2, %ecx
        cmpl    $8, %edi
        cmovae  %rcx, %rax
        cmpl    $1, %eax
        jne     .L104
        movl    $7, %eax
        jmp     .L106
.L104:
        movl    $12, %eax
.L106:
        addq    $8, %rsp
        ret
main:
        subq    $8, %rsp
        leaq    16(%rsp), %rax
        movq    %rax, 0(%rsp)
        xorl    %edi, %edi
        call    choose_group
        cmpl    $7, %eax
        jne     .L111
        movl    $8, %edi
        call    choose_group
        cmpl    $12, %eax
        setne   %al
        movzbl  %al, %eax
        jmp     .L112
.L111:
        movl    $1, %eax
.L112:
        addq    $8, %rsp
        ret`,
  },
};
