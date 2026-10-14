import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, MoreHorizontal, TrendingUp, AlertTriangle, XCircle, X, Pencil, EyeOff, Eye, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@workspace/api-client-react";
import {
  getAllProductsAdmin,
  getCategories,
  createProduct,
  updateProduct,
  createInventory,
  updateInventory,
  uploadProductImage,
} from "@/lib/products/api";
import { formatNaira, PRODUCT_IMAGE_FALLBACK, type Product } from "@/lib/products/types";

type StockStatus = "active" | "low_stock" | "out_of_stock";

function stockStatusOf(product: Product): StockStatus {
  const qty = product.inventory?.stockQuantity ?? 0;
  const threshold = product.inventory?.lowStockThreshold ?? 0;
  if (qty <= 0) return "out_of_stock";
  if (qty <= threshold) return "low_stock";
  return "active";
}

const stockBadge = (status: StockStatus) => {
  if (status === "active") return "bg-green-50 text-green-700";
  if (status === "low_stock") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-600";
};
const stockLabel = (status: StockStatus) => {
  if (status === "active") return "In Stock";
  if (status === "low_stock") return "Low Stock";
  return "Out of Stock";
};
const stockIcon = (status: StockStatus) => {
  if (status === "active") return <TrendingUp className="w-3 h-3" />;
  if (status === "low_stock") return <AlertTriangle className="w-3 h-3" />;
  return <XCircle className="w-3 h-3" />;
};

function apiErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function ActionMenu({
  product,
  onEdit,
  onToggleActive,
}: {
  product: Product;
  onEdit: () => void;
  onToggleActive: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 active:scale-90 transition"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1 text-sm">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 text-slate-700 text-left"
          >
            <Pencil className="w-3.5 h-3.5 text-slate-400" /> Edit product
          </button>
          <button
            onClick={() => { setOpen(false); onToggleActive(); }}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left ${product.isActive ? "hover:bg-red-50 text-red-600" : "hover:bg-green-50 text-green-700"}`}
          >
            {product.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {product.isActive ? "Unpublish (hide from store)" : "Publish (show in store)"}
          </button>
        </div>
      )}
    </div>
  );
}

const BLANK_FORM = {
  name: "",
  slug: "",
  categoryId: "",
  description: "",
  price: "",
  imageUrl: "",
  minOrderQuantity: "1",
  stockQuantity: "",
  lowStockThreshold: "10",
  isActive: true,
};

export function ProductsSection({ search }: { search: string }) {
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [slugTouched, setSlugTouched] = useState(false);

  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["admin-products"],
    queryFn: getAllProductsAdmin,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        categoryId: form.categoryId,
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        imageUrl: form.imageUrl.trim() || undefined,
        minOrderQuantity: Number(form.minOrderQuantity) || 1,
        isActive: form.isActive,
      };
      const stockQuantity = Number(form.stockQuantity) || 0;
      const lowStockThreshold = Number(form.lowStockThreshold) || 0;

      if (editProduct) {
        await updateProduct(editProduct.id, payload);
        if (editProduct.inventory) {
          await updateInventory(editProduct.inventory.id, { stockQuantity, lowStockThreshold });
        } else {
          await createInventory({ productId: editProduct.id, stockQuantity, lowStockThreshold });
        }
      } else {
        const created = await createProduct(payload);
        await createInventory({ productId: created.id, stockQuantity, lowStockThreshold });
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success(editProduct ? `"${form.name}" updated successfully` : `"${form.name}" added to catalog`);
      setShowModal(false);
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Couldn't save this product"));
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (p: Product) => updateProduct(p.id, { isActive: !p.isActive }),
    onSuccess: (_, p) => {
      invalidate();
      toast.success(`${p.name} is now ${p.isActive ? "unpublished" : "published"}`);
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Couldn't update this product"));
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: uploadProductImage,
    onSuccess: (res) => {
      setForm((f) => ({ ...f, imageUrl: res.imageUrl }));
      toast.success("Image uploaded");
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Couldn't upload that image"));
    },
  });

  const filtered = (products ?? []).filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || p.categoryId === categoryFilter;
    const matchStatus = statusFilter === "all" || stockStatusOf(p) === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const openAdd = () => {
    setEditProduct(null);
    setForm({ ...BLANK_FORM, categoryId: categories?.[0]?.id ?? "" });
    setSlugTouched(false);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      slug: p.slug,
      categoryId: p.categoryId,
      description: p.description ?? "",
      price: p.price,
      imageUrl: p.imageUrl ?? "",
      minOrderQuantity: String(p.minOrderQuantity),
      stockQuantity: String(p.inventory?.stockQuantity ?? 0),
      lowStockThreshold: String(p.inventory?.lowStockThreshold ?? 10),
      isActive: p.isActive,
    });
    setSlugTouched(true);
    setShowModal(true);
  };

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.categoryId || !form.price || !form.stockQuantity) {
      toast.error("Please fill in all required fields");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="space-y-4">
      {/* Add / Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-96 max-h-[90vh] overflow-y-auto space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">{editProduct ? "Edit Product" : "Add New Product"}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Product Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Long Grain Parboiled Rice"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Slug (URL-safe id)</label>
                <input
                  value={form.slug}
                  onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: e.target.value })); }}
                  placeholder="long-grain-parboiled-rice"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Category *</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none bg-white"
                >
                  <option value="" disabled>Select a category</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Optional short description"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Product Image</label>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-14 h-14 rounded-lg overflow-hidden ring-1 ring-slate-200 bg-slate-50 shrink-0 flex items-center justify-center">
                    {form.imageUrl ? (
                      <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <label className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-dashed border-slate-200 text-xs font-medium text-slate-500 hover:border-green-400 hover:text-green-600 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadImageMutation.mutate(file);
                        e.target.value = "";
                      }}
                    />
                    {uploadImageMutation.isPending ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="w-3.5 h-3.5" /> Upload photo</>
                    )}
                  </label>
                </div>
                <input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="Or paste an image URL directly"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Price (₦) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Min. order qty</label>
                  <input
                    type="number"
                    value={form.minOrderQuantity}
                    onChange={(e) => setForm({ ...form, minOrderQuantity: e.target.value })}
                    placeholder="1"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Stock quantity *</label>
                  <input
                    type="number"
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                    placeholder="0"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Low stock alert at</label>
                  <input
                    type="number"
                    value={form.lowStockThreshold}
                    onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                    placeholder="10"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-slate-300"
                />
                Published (visible in the store)
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saveMutation.isPending}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saveMutation.isPending ? "Saving..." : editProduct ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              categoryFilter === "all" ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            All
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === cat.id ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
          >
            <option value="all">All Status</option>
            <option value="active">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5 whitespace-nowrap">Product</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5 whitespace-nowrap">Category</th>
                <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3.5 whitespace-nowrap">Price</th>
                <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3.5 whitespace-nowrap">Stock</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5 whitespace-nowrap">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5 whitespace-nowrap">Published</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">Loading products...</td></tr>
              )}
              {isError && (
                <tr><td colSpan={7} className="text-center py-12 text-red-400 text-sm">Couldn't load products. Please try again.</td></tr>
              )}
              {!isLoading && !isError && filtered.map((product) => {
                const status = stockStatusOf(product);
                return (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.imageUrl || PRODUCT_IMAGE_FALLBACK}
                          alt={product.name}
                          className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div>
                          <p className="text-slate-800 font-medium">{product.name}</p>
                          <p className="text-slate-400 text-[11px]">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{product.category.name}</td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{formatNaira(Number(product.price))}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-slate-700 whitespace-nowrap">
                      {(product.inventory?.stockQuantity ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${stockBadge(status)}`}>
                        {stockIcon(status)}
                        {stockLabel(status)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-full ${product.isActive ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                        {product.isActive ? "Published" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <ActionMenu
                        product={product}
                        onEdit={() => openEdit(product)}
                        onToggleActive={() => toggleActiveMutation.mutate(product)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">No products match your filters.</div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filtered.length} of {(products ?? []).length} products</span>
        </div>
      </div>
    </div>
  );
}