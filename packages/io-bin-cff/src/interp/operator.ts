// prettier-ignore
export enum CffOperator {
    Version             = 0x00, Copyright             = 0x0c00,
    Notice              = 0x01, IsFixedPitch          = 0x0c01,
    FullName            = 0x02, ItalicAngle           = 0x0c02,
    FamilyName          = 0x03, UnderlinePosition     = 0x0c03,
    Weight              = 0x04, UnderlineThickness    = 0x0c04,
    FontBBox            = 0x05, PaintType             = 0x0c05,
    BlueValues          = 0x06, CharStringType        = 0x0c06,
    OtherBlues          = 0x07, FontMatrix            = 0x0c07,
    FamilyBlues         = 0x08, StrokeWidth           = 0x0c08,
    FamilyOtherBlues    = 0x09, BlueScale             = 0x0c09,
    StdHW               = 0x0a, BlueShift             = 0x0c0a,
    StdVW               = 0x0b, BlueFuzz              = 0x0c0b,
    /* 0x0c escape --------> */ StemSnapH             = 0x0c0c,
    UniqueID            = 0x0d, StemSnapV             = 0x0c0d,
    XUID                = 0x0e, ForceBold             = 0x0c0e,
    Charset             = 0x0f, /* 0x0c0f Reserved */
    Encoding            = 0x10, /* 0x0c10 Reserved */
    CharStrings         = 0x11, LanguageGroup         = 0x0c11,
    Private             = 0x12, ExpansionFactor       = 0x0c12,
    Subrs               = 0x13, initialRandomSeed     = 0x0c13,
    DefaultWidthX       = 0x14, SyntheticBase         = 0x0c14,
    NominalWidthX       = 0x15, PostScript            = 0x0c15,
    VsIndex             = 0x16, BaseFontName          = 0x0c16,
    Blend               = 0x17, BaseFontBlend         = 0x0c17,
    VStore              = 0x18, /* 0x0c18 Reserved */
    MaxStack            = 0x19, /* 0x0c19 Reserved */
                                /* 0x0c1a Reserved */
                                /* 0x0c1b Reserved */
                                /* 0x0c1c Reserved */
                                /* 0x0c1d Reserved */
                                ROS                   = 0x0c1e,
                                CIDFontVersion        = 0x0c1f,
                                CIDFontRevision       = 0x0c20,
                                CIDFontType           = 0x0c21,
                                CIDCount              = 0x0c22,
                                UIDBase               = 0x0c23,
                                FDArray               = 0x0c24,
                                FDSelect              = 0x0c25,
                                FontName              = 0x0c26
}

// prettier-ignore
export enum CharStringOperator {
    /* 0x00 Reserved */         /* 0x0c00 Reserved */
    HStem         = 0x01,       /* 0x0c01 Reserved */
    /* 0x02 Reserved */         /* 0x0c02 Reserved */
    VStem         = 0x03,       And       = 0x0c03,
    VMoveTo       = 0x04,       Or        = 0x0c04,
    RLineTo       = 0x05,       Not       = 0x0c05,
    HLineTo       = 0x06,       /* 0x0c06 Reserved */
    VLineTo       = 0x07,       /* 0x0c07 Reserved */
    RRCurveTo     = 0x08,       /* 0x0c08 Reserved */
    /* 0x09 Reserved */         Abs       = 0x0c09,
    CallSubr      = 0x0a,       Add       = 0x0c0a,
    Return        = 0x0b,       Sub       = 0x0c0b,
    /* 0x0c escape --> */       Div       = 0x0c0c,
    /* 0x0d Reserved */         /* 0x0c0d Reserved */
    EndChar       = 0x0e,       Neg       = 0x0c0e,
    VsIndex       = 0x0f,       Eq        = 0x0c0f,
    Blend         = 0x10,       /* 0x0c10 Reserved */
    /* 0x11 Reserved */         /* 0x0c11 Reserved */
    HStemHM       = 0x12,       Drop      = 0x0c12,
    HintMask      = 0x13,       /* 0x0c13 Reserved */
    CntrMask      = 0x14,       Put       = 0x0c14,
    RMoveTo       = 0x15,       Get       = 0x0c15,
    HMoveTo       = 0x16,       IfElse    = 0x0c16,
    VStemHM       = 0x17,       Random    = 0x0c17,
    RCurveLine    = 0x18,       Mul       = 0x0c18,
    RLineCurve    = 0x19,       /* 0x0c19 Reserved */
    VVCurveTo     = 0x1a,       Sqrt      = 0x0c1a,
    HHCurveTo     = 0x1b,       Dup       = 0x0c1b,
    /* 0x1c short int */        Exch      = 0x0c1c,
    CallGSubr     = 0x1d,       Index     = 0x0c1d,
    VHCurveTo     = 0x1e,       Roll      = 0x0c1e,
    HVCurveTo     = 0x1f,       /* 0x0c1f Reserved */
                                /* 0x0c20 Reserved */
                                /* 0x0c21 Reserved */
                                HFlex     = 0x0c22,
                                Flex      = 0x0c23,
                                HFlex1    = 0x0c24,
                                Flex1     = 0x0c25,
}
